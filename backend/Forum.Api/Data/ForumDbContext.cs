using Forum.Api.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Forum.Api.Data;

public sealed class ForumDbContext(
    DbContextOptions<ForumDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<PostLike> PostLikes => Set<PostLike>();
    public DbSet<PostTopic> PostTopics => Set<PostTopic>();
    public DbSet<ModerationTag> ModerationTags => Set<ModerationTag>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(user => user.DisplayName).HasMaxLength(100);
            entity.HasIndex(user => user.NormalizedEmail).IsUnique();
        });

        builder.Entity<Post>(entity =>
        {
            entity.Property(post => post.Title).HasMaxLength(180);
            entity.Property(post => post.Content).HasMaxLength(10_000);
            entity.Property(post => post.CreatedAt).HasConversion(
                value => value.UtcDateTime.Ticks,
                value => new DateTimeOffset(value, TimeSpan.Zero));
            entity.HasIndex(post => post.CreatedAt);
            entity.HasIndex(post => post.AuthorId);
            entity.HasOne(post => post.Author)
                .WithMany(user => user.Posts)
                .HasForeignKey(post => post.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Comment>(entity =>
        {
            entity.Property(comment => comment.Content).HasMaxLength(4_000);
            entity.Property(comment => comment.CreatedAt).HasConversion(
                value => value.UtcDateTime.Ticks,
                value => new DateTimeOffset(value, TimeSpan.Zero));
            entity.HasIndex(comment => new { comment.PostId, comment.CreatedAt });
            entity.HasOne(comment => comment.Author)
                .WithMany(user => user.Comments)
                .HasForeignKey(comment => comment.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PostLike>(entity =>
        {
            entity.HasKey(like => new { like.PostId, like.UserId });
            entity.Property(like => like.CreatedAt).HasConversion(
                value => value.UtcDateTime.Ticks,
                value => new DateTimeOffset(value, TimeSpan.Zero));
            entity.HasOne(like => like.User)
                .WithMany(user => user.Likes)
                .HasForeignKey(like => like.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PostTopic>(entity =>
        {
            entity.HasKey(topic => new { topic.PostId, topic.Topic });
            entity.Property(topic => topic.Topic).HasMaxLength(40);
            entity.HasIndex(topic => topic.Topic);
        });

        builder.Entity<ModerationTag>(entity =>
        {
            entity.Property(tag => tag.Tag).HasMaxLength(80);
            entity.Property(tag => tag.CreatedAt).HasConversion(
                value => value.UtcDateTime.Ticks,
                value => new DateTimeOffset(value, TimeSpan.Zero));
            entity.HasIndex(tag => tag.PostId).IsUnique();
            entity.HasOne(tag => tag.Post)
                .WithOne(post => post.ModerationTag)
                .HasForeignKey<ModerationTag>(tag => tag.PostId);
            entity.HasOne(tag => tag.Moderator)
                .WithMany()
                .HasForeignKey(tag => tag.ModeratorId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
