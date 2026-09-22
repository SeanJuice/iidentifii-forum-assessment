namespace Forum.Api.Configuration;

public sealed class SeedOptions
{
    public const string SectionName = "Seed";

    public string DemoPassword { get; init; } = string.Empty;
}

