using Forum.Api.Configuration;
using Forum.Api.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Forum.Api.Data;

public sealed class ForumDataSeeder(
    ForumDbContext dbContext,
    RoleManager<IdentityRole<Guid>> roleManager,
    UserManager<ApplicationUser> userManager,
    IOptions<SeedOptions> seedOptions)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var demoPassword = seedOptions.Value.DemoPassword;
        if (string.IsNullOrWhiteSpace(demoPassword) || demoPassword.Length < 8)
        {
            throw new InvalidOperationException(
                "Set Seed__DemoPassword to a strong password containing at least 8 characters.");
        }

        foreach (var role in AppRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
            }
        }

        var user = await EnsureUserAsync(
            "user@demo.local",
            "Amina Patel",
            AppRoles.User,
            demoPassword);
        var contributor = await EnsureUserAsync(
            "partner@demo.local",
            "Thabo Molefe",
            AppRoles.User,
            demoPassword);
        var moderator = await EnsureUserAsync(
            "moderator@demo.local",
            "Liam Daniels",
            AppRoles.Moderator,
            demoPassword);

        if (await dbContext.Posts.AnyAsync(cancellationToken))
        {
            return;
        }

        var retryPost = CreatePost(
            user,
            "Recommended retry strategy for the verification API",
            "What retry intervals work best for transient verification failures without creating duplicate requests? We currently use exponential backoff and preserve the original correlation identifier.",
            ["API", "Integration"],
            DateTimeOffset.UtcNow.AddHours(-5));
        var webhookPost = CreatePost(
            moderator,
            "Webhook signature validation in the Node SDK",
            "This implementation validates the signature against the raw request body, uses a constant-time comparison, and rejects timestamps outside the accepted replay window.",
            ["SDK", "Security"],
            DateTimeOffset.UtcNow.AddDays(-1));
        var sandboxPost = CreatePost(
            contributor,
            "Does the sandbox return production confidence scores?",
            "Can partners treat sandbox confidence values as representative production results, or are they generated only to exercise the integration workflow?",
            ["Integration", "General"],
            DateTimeOffset.UtcNow.AddDays(-2));

        dbContext.Posts.AddRange(retryPost, webhookPost, sandboxPost);
        dbContext.Comments.AddRange(
            new Comment
            {
                Post = retryPost,
                PostId = retryPost.Id,
                Author = moderator,
                AuthorId = moderator.Id,
                Content = "Use bounded exponential backoff and keep the idempotency key stable across retries.",
                CreatedAt = DateTimeOffset.UtcNow.AddHours(-4),
            },
            new Comment
            {
                Post = webhookPost,
                PostId = webhookPost.Id,
                Author = user,
                AuthorId = user.Id,
                Content = "Including the timestamp in the signed payload also made replay protection easier to audit.",
                CreatedAt = DateTimeOffset.UtcNow.AddHours(-20),
            });
        dbContext.PostLikes.AddRange(
            new PostLike
            {
                Post = retryPost,
                PostId = retryPost.Id,
                User = moderator,
                UserId = moderator.Id,
            },
            new PostLike
            {
                Post = webhookPost,
                PostId = webhookPost.Id,
                User = contributor,
                UserId = contributor.Id,
            });
        dbContext.ModerationTags.Add(new ModerationTag
        {
            Post = sandboxPost,
            PostId = sandboxPost.Id,
            Moderator = moderator,
            ModeratorId = moderator.Id,
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<ApplicationUser> EnsureUserAsync(
        string email,
        string displayName,
        string role,
        string demoPassword)
    {
        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
        {
            user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = email,
                UserName = email,
                DisplayName = displayName,
                EmailConfirmed = true,
            };

            var createResult = await userManager.CreateAsync(user, demoPassword);
            EnsureSucceeded(createResult);
        }

        if (!await userManager.IsInRoleAsync(user, role))
        {
            EnsureSucceeded(await userManager.AddToRoleAsync(user, role));
        }

        return user;
    }

    private static Post CreatePost(
        ApplicationUser author,
        string title,
        string content,
        IReadOnlyCollection<string> topics,
        DateTimeOffset createdAt)
    {
        var post = new Post
        {
            Title = title,
            Content = content,
            Author = author,
            AuthorId = author.Id,
            CreatedAt = createdAt,
        };

        foreach (var topic in topics)
        {
            post.Topics.Add(new PostTopic
            {
                Post = post,
                PostId = post.Id,
                Topic = topic,
            });
        }

        return post;
    }

    private static void EnsureSucceeded(IdentityResult result)
    {
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                string.Join("; ", result.Errors.Select(error => error.Description)));
        }
    }
}
