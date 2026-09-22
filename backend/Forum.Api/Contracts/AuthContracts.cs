using System.ComponentModel.DataAnnotations;

namespace Forum.Api.Contracts;

public sealed record RegisterRequest(
    [property: Required, StringLength(100, MinimumLength = 2)] string DisplayName,
    [property: Required, EmailAddress] string Email,
    [property: Required, MinLength(8)] string Password);

public sealed record LoginRequest(
    [property: Required, EmailAddress] string Email,
    [property: Required] string Password);

public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset ExpiresAt,
    UserResponse User);

public sealed record UserResponse(
    Guid Id,
    string DisplayName,
    string Email,
    IReadOnlyCollection<string> Roles);

