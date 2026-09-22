namespace Forum.Api.Domain;

public sealed class ModerationTag
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PostId { get; set; }
    public required Post Post { get; set; }
    public Guid ModeratorId { get; set; }
    public required ApplicationUser Moderator { get; set; }
    public string Tag { get; set; } = ModerationTags.MisleadingOrFalseInformation;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public static class ModerationTags
{
    public const string MisleadingOrFalseInformation = "Misleading or false information";
}

