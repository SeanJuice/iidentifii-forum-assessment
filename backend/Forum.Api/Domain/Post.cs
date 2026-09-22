namespace Forum.Api.Domain;

public sealed class Post
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Title { get; set; }
    public required string Content { get; set; }
    public Guid AuthorId { get; set; }
    public required ApplicationUser Author { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public ICollection<Comment> Comments { get; } = new List<Comment>();
    public ICollection<PostLike> Likes { get; } = new List<PostLike>();
    public ICollection<PostTopic> Topics { get; } = new List<PostTopic>();
    public ModerationTag? ModerationTag { get; set; }
}

