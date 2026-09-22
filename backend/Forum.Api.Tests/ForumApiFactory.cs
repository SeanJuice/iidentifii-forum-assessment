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
    private static readonly string SharedJwtKey = $"test-signing-key-{Guid.NewGuid():N}";
    private static readonly string SharedDemoPassword = $"Aa1!{Guid.NewGuid():N}";
    private readonly SqliteConnection _databaseConnection = new("Data Source=:memory:");

    public string DemoPassword => SharedDemoPassword;

    public ForumApiFactory()
    {
        Environment.SetEnvironmentVariable("Jwt__Key", SharedJwtKey);
        Environment.SetEnvironmentVariable("Seed__DemoPassword", SharedDemoPassword);
        _databaseConnection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = SharedJwtKey,
                ["Seed:DemoPassword"] = SharedDemoPassword,
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
