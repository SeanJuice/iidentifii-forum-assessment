namespace Forum.Api.Domain;

public sealed class Comment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PostId { get; set; }
    public required Post Post { get; set; }
    public Guid AuthorId { get; set; }
    public required ApplicationUser Author { get; set; }
    public required string Content { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

