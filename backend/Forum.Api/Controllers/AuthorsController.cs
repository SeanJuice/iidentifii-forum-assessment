using Forum.Api.Contracts;
using Forum.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Forum.Api.Controllers;

[ApiController]
[Route("api/v1/authors")]
public sealed class AuthorsController(ForumDbContext dbContext) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType<IReadOnlyCollection<AuthorFilterResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<AuthorFilterResponse>>> GetAll(
        CancellationToken cancellationToken)
    {
        var authors = await dbContext.Users
            .AsNoTracking()
            .Where(user => user.Posts.Any())
            .OrderBy(user => user.DisplayName)
            .Select(user => new AuthorFilterResponse(
                user.Id,
                user.DisplayName,
                user.Posts.Count))
            .ToListAsync(cancellationToken);

        return Ok(authors);
    }
}
