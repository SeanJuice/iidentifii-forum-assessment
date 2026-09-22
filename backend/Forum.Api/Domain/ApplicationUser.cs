using Microsoft.AspNetCore.Identity;

namespace Forum.Api.Domain;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    public required string DisplayName { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Post> Posts { get; } = new List<Post>();
    public ICollection<Comment> Comments { get; } = new List<Comment>();
    public ICollection<PostLike> Likes { get; } = new List<PostLike>();
}

