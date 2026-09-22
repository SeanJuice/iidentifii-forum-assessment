using System.ComponentModel.DataAnnotations;

namespace Forum.Api.Contracts;

public sealed record CreatePostRequest(
    [Required, StringLength(180, MinimumLength = 5)] string Title,
    [Required, StringLength(10_000, MinimumLength = 10)] string Content,
    IReadOnlyCollection<string>? Topics);

public sealed record CreateCommentRequest(
    [Required, StringLength(4_000, MinimumLength = 2)] string Content);

public sealed record AuthorResponse(
    Guid Id,
    string DisplayName,
    string Role);

public sealed record PostListItemResponse(
    Guid Id,
    string Title,
    string Excerpt,
    AuthorResponse Author,
    IReadOnlyCollection<string> Topics,
    DateTimeOffset CreatedAt,
    int LikeCount,
    int CommentCount,
    bool LikedByCurrentUser,
    bool IsFlagged);

public sealed record CommentResponse(
    Guid Id,
    string Content,
    AuthorResponse Author,
    DateTimeOffset CreatedAt);

public sealed record ModerationTagResponse(
    string Tag,
    AuthorResponse Moderator,
    DateTimeOffset CreatedAt);

public sealed record PostDetailResponse(
    Guid Id,
    string Title,
    string Content,
    AuthorResponse Author,
    IReadOnlyCollection<string> Topics,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    int LikeCount,
    bool LikedByCurrentUser,
    IReadOnlyCollection<CommentResponse> Comments,
    ModerationTagResponse? ModerationTag);

public sealed record PagedResponse<T>(
    IReadOnlyCollection<T> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);

public sealed class PostQueryParameters
{
    [Range(1, int.MaxValue)]
    public int Page { get; init; } = 1;

    [Range(1, 50)]
    public int PageSize { get; init; } = 10;

    public DateTimeOffset? FromDate { get; init; }
    public DateTimeOffset? ToDate { get; init; }
    public Guid? AuthorId { get; init; }
    public string? Topic { get; init; }
    public string SortBy { get; init; } = "date";
    public string SortDirection { get; init; } = "desc";
}
