using System.Security.Claims;

namespace Forum.Api.Security;

public static class CurrentUserExtensions
{
    public static Guid GetRequiredUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(value, out var userId)
            ? userId
            : throw new UnauthorizedAccessException("The access token does not contain a valid user identifier.");
    }
}

