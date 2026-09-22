using Forum.Api.Contracts;
using Forum.Api.Domain;
using Forum.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Forum.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    JwtTokenService tokenService) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await userManager.FindByEmailAsync(normalizedEmail) is not null)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Email already registered",
                Detail = "An account already exists for this email address.",
                Status = StatusCodes.Status409Conflict,
            });
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = normalizedEmail,
            Email = normalizedEmail,
            DisplayName = request.DisplayName.Trim(),
        };
        var result = await userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(error.Code, error.Description);
            }

            return ValidationProblem(ModelState);
        }

        await userManager.AddToRoleAsync(user, AppRoles.User);
        return StatusCode(
            StatusCodes.Status201Created,
            tokenService.CreateToken(user, [AppRoles.User]));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null)
        {
            return UnauthorizedProblem();
        }

        var result = await signInManager.CheckPasswordSignInAsync(
            user,
            request.Password,
            lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            return UnauthorizedProblem();
        }

        var roles = await userManager.GetRolesAsync(user);
        return Ok(tokenService.CreateToken(user, roles.ToArray()));
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType<UserResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<UserResponse>> Me()
    {
        var user = await userManager.FindByIdAsync(User.GetRequiredUserId().ToString());
        if (user is null)
        {
            return NotFound();
        }

        var roles = await userManager.GetRolesAsync(user);
        return Ok(new UserResponse(
            user.Id,
            user.DisplayName,
            user.Email ?? string.Empty,
            roles.ToArray()));
    }

    private ObjectResult UnauthorizedProblem() => Unauthorized(new ProblemDetails
    {
        Title = "Invalid credentials",
        Detail = "The email address or password is incorrect.",
        Status = StatusCodes.Status401Unauthorized,
    });
}
