namespace Forum.Api.Domain;

public static class AppRoles
{
    public const string User = "User";
    public const string Moderator = "Moderator";

    public static readonly string[] All = [User, Moderator];
}

