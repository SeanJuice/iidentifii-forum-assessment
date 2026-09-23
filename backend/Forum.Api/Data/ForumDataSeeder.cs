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
                EnsureSucceeded(await roleManager.CreateAsync(new IdentityRole<Guid>(role)));
            }
        }

        var users = new[]
        {
            await EnsureUserAsync("user@demo.local", "Amina Patel", AppRoles.User, demoPassword),
            await EnsureUserAsync("partner@demo.local", "Thabo Molefe", AppRoles.User, demoPassword),
            await EnsureUserAsync("moderator@demo.local", "Liam Daniels", AppRoles.Moderator, demoPassword),
            await EnsureUserAsync("naledi@demo.local", "Naledi Dlamini", AppRoles.User, demoPassword),
            await EnsureUserAsync("ethan@demo.local", "Ethan Jacobs", AppRoles.User, demoPassword),
            await EnsureUserAsync("priya@demo.local", "Priya Naidoo", AppRoles.User, demoPassword),
            await EnsureUserAsync("kabelo@demo.local", "Kabelo Nkosi", AppRoles.User, demoPassword),
            await EnsureUserAsync("sarah@demo.local", "Sarah Williams", AppRoles.User, demoPassword),
        };
        var moderator = users.Single(user => user.Email == "moderator@demo.local");

        var existingPostCount = await dbContext.Posts.CountAsync(cancellationToken);
        if (existingPostCount >= 40)
        {
            return;
        }

        if (existingPostCount == 0)
        {
            SeedFeaturedDiscussions(users[0], users[1], moderator);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        await SeedShowcaseDiscussionsAsync(users, moderator, cancellationToken);
    }

    private void SeedFeaturedDiscussions(
        ApplicationUser user,
        ApplicationUser contributor,
        ApplicationUser moderator)
    {
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

        retryPost.Comments.Add(CreateComment(
            retryPost,
            moderator,
            "Use bounded exponential backoff and keep the idempotency key stable across retries.",
            DateTimeOffset.UtcNow.AddHours(-4)));
        webhookPost.Comments.Add(CreateComment(
            webhookPost,
            user,
            "Including the timestamp in the signed payload also made replay protection easier to audit.",
            DateTimeOffset.UtcNow.AddHours(-20)));
        retryPost.Likes.Add(CreateLike(retryPost, moderator));
        webhookPost.Likes.Add(CreateLike(webhookPost, contributor));
        sandboxPost.ModerationTag = CreateModerationTag(sandboxPost, moderator);

        dbContext.Posts.AddRange(retryPost, webhookPost, sandboxPost);
    }

    private async Task SeedShowcaseDiscussionsAsync(
        IReadOnlyList<ApplicationUser> users,
        ApplicationUser moderator,
        CancellationToken cancellationToken)
    {
        if (await dbContext.Posts.AnyAsync(
                post => post.Title.StartsWith("[Showcase]"),
                cancellationToken))
        {
            return;
        }

        var themes = new[]
        {
            new DiscussionTheme("Handling verification timeouts", "How should clients distinguish a transient timeout from a final verification failure?", ["API", "Integration"]),
            new DiscussionTheme("Rotating webhook signing secrets", "What rollout sequence avoids dropped events while both signing secrets are briefly valid?", ["Security", "Integration"]),
            new DiscussionTheme("Choosing an SDK integration pattern", "Which SDK lifecycle works best when several products share one identity workflow?", ["SDK", "Integration"]),
            new DiscussionTheme("Protecting personally identifiable information", "Which fields should be redacted from application logs and support traces?", ["Security", "General"]),
            new DiscussionTheme("Designing idempotent submission requests", "How can a client retry safely when the first response is lost after processing?", ["API", "Security"]),
            new DiscussionTheme("Mapping partner reference identifiers", "Where should an external reference be stored so support teams can trace a transaction?", ["Integration", "General"]),
            new DiscussionTheme("Monitoring callback delivery", "Which metrics and alerts provide early warning of delayed callback processing?", ["API", "Integration"]),
            new DiscussionTheme("Validating document upload formats", "How should clients validate size and media type before sending a document?", ["SDK", "Security"]),
            new DiscussionTheme("Managing sandbox test identities", "What is the safest way to share repeatable test identities across an engineering team?", ["Integration", "General"]),
            new DiscussionTheme("Interpreting confidence thresholds", "Should decision thresholds be fixed globally or configured for each use case?", ["API", "General"]),
            new DiscussionTheme("Reducing mobile capture failures", "Which capture hints have the largest impact on image quality for mobile users?", ["SDK", "General"]),
            new DiscussionTheme("Securing service-to-service calls", "Should partner services use separate credentials for each deployed environment?", ["Security", "API"]),
            new DiscussionTheme("Planning a zero-downtime API upgrade", "How can consumers move between API versions without interrupting active journeys?", ["API", "Integration"]),
            new DiscussionTheme("Troubleshooting duplicate callbacks", "What evidence is needed to determine whether duplication happened at delivery or consumption?", ["Integration", "API"]),
            new DiscussionTheme("Auditing moderator decisions", "Which details should be retained when community content receives a moderation tag?", ["Security", "General"]),
        };
        var contexts = new[]
        {
            new DiscussionContext("during a production rollout", "The team is preparing a phased production release and needs an approach that remains safe under partial failure."),
            new DiscussionContext("in the partner sandbox", "The integration has been reproduced in the sandbox and the team wants to confirm expected platform behaviour."),
            new DiscussionContext("for a high-volume workflow", "The projected transaction volume is high, so operational visibility and predictable failure handling are important."),
        };
        var commentTemplates = new[]
        {
            "We solved a similar case by documenting the expected state transition before changing the client implementation.",
            "Add the correlation identifier to the support evidence, but avoid logging personal information.",
            "A small sandbox test with forced failures helped us validate the retry and monitoring behaviour.",
            "Keep the integration decision configurable so it can evolve without requiring an application release.",
            "The API response and webhook should be treated as separate signals and reconciled by identifier.",
        };

        var posts = new List<Post>();
        var index = 0;
        foreach (var context in contexts)
        {
            foreach (var theme in themes)
            {
                var author = users[index % users.Count];
                var createdAt = DateTimeOffset.UtcNow
                    .AddDays(-(index * 2 + 3))
                    .AddHours(-(index % 12));
                var post = CreatePost(
                    author,
                    $"[Showcase] {theme.Title} {context.Title}",
                    $"{theme.Question} {context.Detail} Please share recommended safeguards, implementation trade-offs, and useful monitoring signals.",
                    theme.Topics,
                    createdAt);

                var eligibleUsers = users.Where(user => user.Id != author.Id).ToArray();
                var likeCount = index % users.Count;
                foreach (var liker in eligibleUsers.Take(likeCount))
                {
                    post.Likes.Add(CreateLike(post, liker));
                }

                var commentCount = index % 6;
                for (var commentIndex = 0; commentIndex < commentCount; commentIndex++)
                {
                    var commenter = eligibleUsers[(index + commentIndex) % eligibleUsers.Length];
                    post.Comments.Add(CreateComment(
                        post,
                        commenter,
                        commentTemplates[(index + commentIndex) % commentTemplates.Length],
                        createdAt.AddHours(commentIndex + 2)));
                }

                if (index % 10 == 0)
                {
                    post.ModerationTag = CreateModerationTag(post, moderator);
                }

                posts.Add(post);
                index++;
            }
        }

        dbContext.Posts.AddRange(posts);
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

            EnsureSucceeded(await userManager.CreateAsync(user, demoPassword));
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

    private static Comment CreateComment(
        Post post,
        ApplicationUser author,
        string content,
        DateTimeOffset createdAt) => new()
    {
        Post = post,
        PostId = post.Id,
        Author = author,
        AuthorId = author.Id,
        Content = content,
        CreatedAt = createdAt,
    };

    private static PostLike CreateLike(Post post, ApplicationUser user) => new()
    {
        Post = post,
        PostId = post.Id,
        User = user,
        UserId = user.Id,
    };

    private static ModerationTag CreateModerationTag(
        Post post,
        ApplicationUser moderator) => new()
    {
        Post = post,
        PostId = post.Id,
        Moderator = moderator,
        ModeratorId = moderator.Id,
        CreatedAt = post.CreatedAt.AddHours(12),
    };

    private static void EnsureSucceeded(IdentityResult result)
    {
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                string.Join("; ", result.Errors.Select(error => error.Description)));
        }
    }

    private sealed record DiscussionTheme(
        string Title,
        string Question,
        IReadOnlyCollection<string> Topics);

    private sealed record DiscussionContext(string Title, string Detail);
}
