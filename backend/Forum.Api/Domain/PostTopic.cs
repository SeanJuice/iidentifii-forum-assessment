namespace Forum.Api.Domain;

public sealed class PostTopic
{
    public Guid PostId { get; set; }
    public required Post Post { get; set; }
    public required string Topic { get; set; }
}

