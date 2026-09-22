using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Forum.Api.Contracts;
using Xunit;

namespace Forum.Api.Tests;

public sealed class ForumApiTests
{
    [Fact]
    public async Task AnonymousUserCanBrowseFilteredPosts()
    {
        await using var factory = new ForumApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync(
            "/api/v1/posts?topic=Security&sortBy=likes&sortDirection=desc&page=1&pageSize=2");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var page = await response.Content.ReadFromJsonAsync<PagedResponse<PostListItemResponse>>();
        Assert.NotNull(page);
        Assert.NotEmpty(page.Items);
        Assert.All(page.Items, post => Assert.Contains("Security", post.Topics));
        Assert.True(page.PageSize == 2);
    }

    [Fact]
    public async Task CreatingPostRequiresAuthentication()
    {
        await using var factory = new ForumApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/v1/posts",
            new CreatePostRequest(
                "A protected discussion",
                "This content is long enough to satisfy validation.",
                ["General"]));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AuthorCanCreatePostButCannotLikeOwnPost()
    {
        await using var factory = new ForumApiFactory();
        using var client = factory.CreateClient();
        await AuthenticateNewUserAsync(client);

        var createResponse = await client.PostAsJsonAsync(
            "/api/v1/posts",
            new CreatePostRequest(
                "How should correlation identifiers be propagated?",
                "I want to preserve one identifier across every integration request and retry.",
                ["API", "Integration"]));
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<CreatedPostResponse>();
        Assert.NotNull(created);

        var likeResponse = await client.PostAsJsonAsync(
            $"/api/v1/posts/{created.Id}/likes",
            new { });

        Assert.Equal(HttpStatusCode.BadRequest, likeResponse.StatusCode);
    }

    [Fact]
    public async Task UserCanLikeAnotherPostOnlyOnce()
    {
        await using var factory = new ForumApiFactory();
        using var client = factory.CreateClient();
        await AuthenticateNewUserAsync(client);
        var posts = await client.GetFromJsonAsync<PagedResponse<PostListItemResponse>>(
            "/api/v1/posts?page=1&pageSize=10&sortBy=date&sortDirection=desc");
        var targetPost = Assert.Single(
            posts!.Items,
            post => post.Title.Contains("retry strategy"));

        var firstLike = await client.PostAsJsonAsync(
            $"/api/v1/posts/{targetPost.Id}/likes",
            new { });
        var duplicateLike = await client.PostAsJsonAsync(
            $"/api/v1/posts/{targetPost.Id}/likes",
            new { });

        Assert.Equal(HttpStatusCode.NoContent, firstLike.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, duplicateLike.StatusCode);
    }

    [Fact]
    public async Task ModerationTagRequiresModeratorRole()
    {
        await using var factory = new ForumApiFactory();
        using var regularClient = factory.CreateClient();
        await AuthenticateNewUserAsync(regularClient);
        var posts = await regularClient.GetFromJsonAsync<PagedResponse<PostListItemResponse>>(
            "/api/v1/posts?page=1&pageSize=10&sortBy=date&sortDirection=desc");
        var targetPost = posts!.Items.First(post => !post.IsFlagged);

        var forbidden = await regularClient.PostAsJsonAsync(
            $"/api/v1/posts/{targetPost.Id}/moderation-tags",
            new { });
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);

        using var moderatorClient = factory.CreateClient();
        var login = await moderatorClient.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginRequest("moderator@demo.local", factory.DemoPassword));
        login.EnsureSuccessStatusCode();
        var auth = await login.Content.ReadFromJsonAsync<AuthResponse>();
        moderatorClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        var created = await moderatorClient.PostAsJsonAsync(
            $"/api/v1/posts/{targetPost.Id}/moderation-tags",
            new { });

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
    }

    private static async Task AuthenticateNewUserAsync(HttpClient client)
    {
        var identifier = Guid.NewGuid().ToString("N");
        var response = await client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new RegisterRequest(
                $"Test User {identifier[..6]}",
                $"user-{identifier}@example.test",
                $"Aa1!{identifier}"));
        var responseBody = await response.Content.ReadAsStringAsync();
        Assert.True(
            response.IsSuccessStatusCode,
            $"Registration failed with {(int)response.StatusCode}: {responseBody}");
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        var currentUserResponse = await client.GetAsync("/api/v1/auth/me");
        var currentUserBody = await currentUserResponse.Content.ReadAsStringAsync();
        var authenticationHeaders = string.Join(
            "; ",
            currentUserResponse.Headers.WwwAuthenticate.Select(header => header.ToString()));
        Assert.True(
            currentUserResponse.IsSuccessStatusCode,
            $"Token validation failed with {(int)currentUserResponse.StatusCode}: " +
            $"{authenticationHeaders} {currentUserBody}");
    }

    private sealed record CreatedPostResponse(Guid Id);
}
