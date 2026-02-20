using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Models;

namespace PersonalLibrary.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Book> Books => Set<Book>();
    public DbSet<User> Users => Set<User>();
    public DbSet<FriendRequest> FriendRequests => Set<FriendRequest>();
    public DbSet<BookRating> BookRatings => Set<BookRating>();
    public DbSet<BookReview> BookReviews => Set<BookReview>();
    public DbSet<UserBook> UserBooks => Set<UserBook>();
    public DbSet<Author> Authors => Set<Author>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<BookRecommendation> BookRecommendations => Set<BookRecommendation>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<BookRating>()
            .HasIndex(br => new { br.UserId, br.BookId })
            .IsUnique();

        // Non-unique index to keep review queries fast while allowing multiple
        // reviews per user for the same book.
        modelBuilder.Entity<BookReview>()
            .HasIndex(br => new { br.UserId, br.BookId });

        modelBuilder.Entity<UserBook>()
            .HasIndex(ub => new { ub.UserId, ub.BookId })
            .IsUnique();

        modelBuilder.Entity<FriendRequest>()
            .HasIndex(fr => new { fr.SenderId, fr.ReceiverId })
            .IsUnique()
            .HasFilter("[Status] = 'Pending'");

        modelBuilder.Entity<FriendRequest>()
            .HasOne(fr => fr.Sender)
            .WithMany()
            .HasForeignKey(fr => fr.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<FriendRequest>()
            .HasOne(fr => fr.Receiver)
            .WithMany()
            .HasForeignKey(fr => fr.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BookRecommendation>()
            .HasOne(r => r.FromUser)
            .WithMany()
            .HasForeignKey(r => r.FromUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BookRecommendation>()
            .HasOne(r => r.ToUser)
            .WithMany()
            .HasForeignKey(r => r.ToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BookRecommendation>()
            .HasOne(r => r.Book)
            .WithMany()
            .HasForeignKey(r => r.BookId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
