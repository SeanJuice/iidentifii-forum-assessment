using Forum.Api.Contracts;
using Forum.Api.Data;
using Forum.Api.Domain;
using Forum.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Forum.Api.Controllers;

[ApiController]
[Route("api/v1/posts")]
public sealed class PostsController(
    ForumDbContext dbContext,
    UserManager<ApplicationUser> userManager) : ControllerBase
{
    private static readonly HashSet<string> AllowedTopics = new(
        ["API", "Integration", "Security", "SDK", "General"],
        StringComparer.OrdinalIgnoreCase);

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType<PagedResponse<PostListItemResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<PostListItemResponse>>> GetAll(
        [FromQuery] PostQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        Guid? currentUserId = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            currentUserId = User.GetRequiredUserId();
        }

        var query = dbContext.Posts.AsNoTracking();

        if (parameters.FromDate is not null)
        {
            query = query.Where(post => post.CreatedAt >= parameters.FromDate);
        }

        if (parameters.ToDate is not null)
        {
            query = query.Where(post => post.CreatedAt <= parameters.ToDate);
        }

        if (parameters.AuthorId is not null)
        {
            query = query.Where(post => post.AuthorId == parameters.AuthorId);
        }

        if (!string.IsNullOrWhiteSpace(parameters.Topic))
        {
            var topic = parameters.Topic.Trim();
            query = query.Where(post => post.Topics.Any(item => item.Topic == topic));
        }

        if (parameters.Flagged is not null)
        {
            query = parameters.Flagged.Value
                ? query.Where(post => post.ModerationTag != null)
                : query.Where(post => post.ModerationTag == null);
        }

        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var searchPattern = $"%{EscapeLikePattern(parameters.Search.Trim())}%";
            query = query.Where(post =>
                EF.Functions.Like(post.Title, searchPattern, "\\") ||
                EF.Functions.Like(post.Content, searchPattern, "\\") ||
                EF.Functions.Like(post.Author.DisplayName, searchPattern, "\\") ||
                post.Topics.Any(topic =>
                    EF.Functions.Like(topic.Topic, searchPattern, "\\")));
        }

        var descending = !string.Equals(
            parameters.SortDirection,
            "asc",
            StringComparison.OrdinalIgnoreCase);
        query = parameters.SortBy.ToLowerInvariant() switch
        {
            "likes" when descending => query
                .OrderByDescending(post => post.Likes.Count)
                .ThenByDescending(post => post.CreatedAt)
                .ThenBy(post => post.Id),
            "likes" => query
                .OrderBy(post => post.Likes.Count)
                .ThenByDescending(post => post.CreatedAt)
                .ThenBy(post => post.Id),
            "date" when descending => query
                .OrderByDescending(post => post.CreatedAt)
                .ThenBy(post => post.Id),
            _ => query
                .OrderBy(post => post.CreatedAt)
                .ThenBy(post => post.Id),
        };

        var totalItems = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .Select(post => new PostListItemResponse(
                post.Id,
                post.Title,
                post.Content.Length > 220
                    ? post.Content.Substring(0, 220) + "…"
                    : post.Content,
                new AuthorResponse(
                    post.Author.Id,
                    post.Author.DisplayName,
                    dbContext.UserRoles
                        .Where(userRole => userRole.UserId == post.AuthorId)
                        .Join(
                            dbContext.Roles,
                            userRole => userRole.RoleId,
                            role => role.Id,
                            (_, role) => role.Name)
                        .FirstOrDefault() ?? AppRoles.User),
                post.Topics.OrderBy(topic => topic.Topic).Select(topic => topic.Topic).ToList(),
                post.CreatedAt,
                post.Likes.Count,
                post.Comments.Count,
                currentUserId != null && post.Likes.Any(like => like.UserId == currentUserId),
                post.ModerationTag != null))
            .ToListAsync(cancellationToken);

        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)parameters.PageSize);

        return Ok(new PagedResponse<PostListItemResponse>(
            items,
            parameters.Page,
            parameters.PageSize,
            totalItems,
            totalPages));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType<PostDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PostDetailResponse>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        Guid? currentUserId = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            currentUserId = User.GetRequiredUserId();
        }

        var post = await dbContext.Posts
            .AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new PostDetailResponse(
                item.Id,
                item.Title,
                item.Content,
                new AuthorResponse(
                    item.Author.Id,
                    item.Author.DisplayName,
                    dbContext.UserRoles
                        .Where(userRole => userRole.UserId == item.AuthorId)
                        .Join(
                            dbContext.Roles,
                            userRole => userRole.RoleId,
                            role => role.Id,
                            (_, role) => role.Name)
                        .FirstOrDefault() ?? AppRoles.User),
                item.Topics.OrderBy(topic => topic.Topic).Select(topic => topic.Topic).ToList(),
                item.CreatedAt,
                item.UpdatedAt,
                item.Likes.Count,
                currentUserId != null && item.Likes.Any(like => like.UserId == currentUserId),
                item.Comments.Count,
                item.ModerationTag == null
                    ? null
                    : new ModerationTagResponse(
                        item.ModerationTag.Tag,
                        new AuthorResponse(
                            item.ModerationTag.Moderator.Id,
                            item.ModerationTag.Moderator.DisplayName,
                            AppRoles.Moderator),
                        item.ModerationTag.CreatedAt)))
            .SingleOrDefaultAsync(cancellationToken);

        return post is null ? NotFound() : Ok(post);
    }

    [HttpGet("{id:guid}/comments")]
    [AllowAnonymous]
    [ProducesResponseType<PagedResponse<CommentResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PagedResponse<CommentResponse>>> GetComments(
        Guid id,
        [FromQuery] CommentQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        if (!await dbContext.Posts.AnyAsync(post => post.Id == id, cancellationToken))
        {
            return NotFound();
        }

        var query = dbContext.Comments
            .AsNoTracking()
            .Where(comment => comment.PostId == id);

        if (parameters.FromDate is not null)
        {
            query = query.Where(comment => comment.CreatedAt >= parameters.FromDate);
        }

        if (parameters.ToDate is not null)
        {
            query = query.Where(comment => comment.CreatedAt <= parameters.ToDate);
        }

        if (parameters.AuthorId is not null)
        {
            query = query.Where(comment => comment.AuthorId == parameters.AuthorId);
        }

        var descending = string.Equals(
            parameters.SortDirection,
            "desc",
            StringComparison.OrdinalIgnoreCase);
        query = descending
            ? query.OrderByDescending(comment => comment.CreatedAt).ThenBy(comment => comment.Id)
            : query.OrderBy(comment => comment.CreatedAt).ThenBy(comment => comment.Id);

        var totalItems = await query.CountAsync(cancellationToken);
        var comments = await query
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .Select(comment => new CommentResponse(
                comment.Id,
                comment.Content,
                new AuthorResponse(
                    comment.Author.Id,
                    comment.Author.DisplayName,
                    dbContext.UserRoles
                        .Where(userRole => userRole.UserId == comment.AuthorId)
                        .Join(
                            dbContext.Roles,
                            userRole => userRole.RoleId,
                            role => role.Id,
                            (_, role) => role.Name)
                        .FirstOrDefault() ?? AppRoles.User),
                comment.CreatedAt))
            .ToListAsync(cancellationToken);

        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)parameters.PageSize);

        return Ok(new PagedResponse<CommentResponse>(
            comments,
            parameters.Page,
            parameters.PageSize,
            totalItems,
            totalPages));
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        CreatePostRequest request,
        CancellationToken cancellationToken)
    {
        var topics = (request.Topics ?? [])
            .Select(topic => topic.Trim())
            .Where(topic => topic.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var invalidTopics = topics.Where(topic => !AllowedTopics.Contains(topic)).ToArray();
        if (invalidTopics.Length > 0)
        {
            ModelState.AddModelError(
                nameof(request.Topics),
                $"Unsupported topics: {string.Join(", ", invalidTopics)}.");
            return ValidationProblem(ModelState);
        }

        var userId = User.GetRequiredUserId();
        var author = await userManager.FindByIdAsync(userId.ToString());
        if (author is null)
        {
            return Unauthorized();
        }

        var post = new Post
        {
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            AuthorId = author.Id,
            Author = author,
        };
        foreach (var topic in topics)
        {
            post.Topics.Add(new PostTopic
            {
                PostId = post.Id,
                Post = post,
                Topic = topic,
            });
        }

        dbContext.Posts.Add(post);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = post.Id }, new { post.Id });
    }

    [HttpPost("{id:guid}/comments")]
    [Authorize]
    [ProducesResponseType<CommentResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CommentResponse>> AddComment(
        Guid id,
        CreateCommentRequest request,
        CancellationToken cancellationToken)
    {
        var post = await dbContext.Posts.FindAsync([id], cancellationToken);
        if (post is null)
        {
            return NotFound();
        }

        var userId = User.GetRequiredUserId();
        var author = await userManager.FindByIdAsync(userId.ToString());
        if (author is null)
        {
            return Unauthorized();
        }

        var comment = new Comment
        {
            PostId = post.Id,
            Post = post,
            AuthorId = author.Id,
            Author = author,
            Content = request.Content.Trim(),
        };
        dbContext.Comments.Add(comment);
        await dbContext.SaveChangesAsync(cancellationToken);

        var roles = await userManager.GetRolesAsync(author);
        return StatusCode(
            StatusCodes.Status201Created,
            new CommentResponse(
                comment.Id,
                comment.Content,
                new AuthorResponse(
                    author.Id,
                    author.DisplayName,
                    roles.FirstOrDefault() ?? AppRoles.User),
                comment.CreatedAt));
    }

    [HttpPost("{id:guid}/likes")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Like(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredUserId();
        var post = await dbContext.Posts
            .AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new { item.Id, item.AuthorId })
            .SingleOrDefaultAsync(cancellationToken);

        if (post is null)
        {
            return NotFound();
        }

        if (post.AuthorId == userId)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Self-like not allowed",
                Detail = "Users cannot like their own posts.",
                Status = StatusCodes.Status400BadRequest,
            });
        }

        if (await dbContext.PostLikes.AnyAsync(
                like => like.PostId == id && like.UserId == userId,
                cancellationToken))
        {
            return Conflict(new ProblemDetails
            {
                Title = "Post already liked",
                Detail = "A user may only like a post once.",
                Status = StatusCodes.Status409Conflict,
            });
        }

        dbContext.PostLikes.Add(new PostLike
        {
            PostId = id,
            Post = null!,
            UserId = userId,
            User = null!,
        });

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Post already liked",
                Detail = "A user may only like a post once.",
                Status = StatusCodes.Status409Conflict,
            });
        }

        return NoContent();
    }

    [HttpDelete("{id:guid}/likes")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Unlike(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredUserId();
        var like = await dbContext.PostLikes.FindAsync([id, userId], cancellationToken);
        if (like is not null)
        {
            dbContext.PostLikes.Remove(like);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return NoContent();
    }

    [HttpPost("{id:guid}/moderation-tags")]
    [Authorize(Roles = AppRoles.Moderator)]
    [ProducesResponseType<ModerationTagResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ModerationTagResponse>> AddModerationTag(
        Guid id,
        CancellationToken cancellationToken)
    {
        var post = await dbContext.Posts.FindAsync([id], cancellationToken);
        if (post is null)
        {
            return NotFound();
        }

        if (await dbContext.ModerationTags.AnyAsync(tag => tag.PostId == id, cancellationToken))
        {
            return Conflict(new ProblemDetails
            {
                Title = "Post already tagged",
                Detail = "This post already has a moderation tag.",
                Status = StatusCodes.Status409Conflict,
            });
        }

        var moderatorId = User.GetRequiredUserId();
        var moderator = await userManager.FindByIdAsync(moderatorId.ToString());
        if (moderator is null)
        {
            return Unauthorized();
        }

        var tag = new ModerationTag
        {
            PostId = post.Id,
            Post = post,
            ModeratorId = moderator.Id,
            Moderator = moderator,
        };
        dbContext.ModerationTags.Add(tag);
        await dbContext.SaveChangesAsync(cancellationToken);

        return StatusCode(
            StatusCodes.Status201Created,
            new ModerationTagResponse(
                tag.Tag,
                new AuthorResponse(moderator.Id, moderator.DisplayName, AppRoles.Moderator),
                tag.CreatedAt));
    }

    private static string EscapeLikePattern(string value) => value
        .Replace("\\", "\\\\", StringComparison.Ordinal)
        .Replace("%", "\\%", StringComparison.Ordinal)
        .Replace("_", "\\_", StringComparison.Ordinal);
}
