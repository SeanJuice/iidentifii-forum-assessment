namespace Forum.Api.Domain;

public sealed class PostLike
{
    public Guid PostId { get; set; }
    public required Post Post { get; set; }
    public Guid UserId { get; set; }
    public required ApplicationUser User { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

