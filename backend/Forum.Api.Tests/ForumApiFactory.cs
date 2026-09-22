using Forum.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Forum.Api.Tests;

public sealed class ForumApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"forum-tests-{Guid.NewGuid():N}";

    public string DemoPassword { get; } = $"Aa1!{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = $"test-signing-key-{Guid.NewGuid():N}",
                ["Jwt:Issuer"] = "Forum.Api.Tests",
                ["Jwt:Audience"] = "Forum.Api.Tests",
                ["Seed:DemoPassword"] = DemoPassword,
            });
        });
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<ForumDbContext>>();
            services.AddDbContext<ForumDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName));
        });
    }
}
