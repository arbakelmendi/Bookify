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


    public DbSet<UserBook> UserBooks => Set<UserBook>();
    public DbSet<Author> Authors => Set<Author>();

    public DbSet<Category> Categories => Set<Category>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {

        modelBuilder.Entity<BookRating>()
            .HasIndex(br => new { br.UserId, br.BookId })
            .IsUnique();


        base.OnModelCreating(modelBuilder);

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
    }
}