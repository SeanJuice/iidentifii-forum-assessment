using Forum.Api.Data;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Forum.Api.Tests;

public sealed class ForumApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _databaseConnection = new("Data Source=:memory:");
    private readonly string _jwtKey = $"test-signing-key-{Guid.NewGuid():N}";

    public string DemoPassword { get; } = $"Aa1!{Guid.NewGuid():N}";

    public ForumApiFactory()
    {
        Environment.SetEnvironmentVariable("Jwt__Key", _jwtKey);
        Environment.SetEnvironmentVariable("Seed__DemoPassword", DemoPassword);
        _databaseConnection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = _jwtKey,
                ["Jwt:Issuer"] = "Forum.Api.Tests",
                ["Jwt:Audience"] = "Forum.Api.Tests",
                ["Seed:DemoPassword"] = DemoPassword,
            });
        });
        builder.ConfigureServices(services =>
        {
            services.PostConfigure<ProblemDetailsOptions>(options =>
            {
                options.CustomizeProblemDetails = context =>
                {
                    var exception = context.HttpContext.Features
                        .Get<IExceptionHandlerFeature>()?
                        .Error;
                    if (exception is not null)
                    {
                        context.ProblemDetails.Detail = exception.ToString();
                    }
                };
            });
            services.RemoveAll<DbContextOptions<ForumDbContext>>();
            services.AddDbContext<ForumDbContext>(options =>
                options.UseSqlite(_databaseConnection));
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            _databaseConnection.Dispose();
        }
    }
}
