using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Models;

namespace PersonalLibrary.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Book> Books => Set<Book>();
    public DbSet<User> Users => Set<User>();
    public DbSet<FriendRequest> FriendRequests => Set<FriendRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
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