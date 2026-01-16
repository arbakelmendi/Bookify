using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Models;

namespace PersonalLibrary.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Book> Books => Set<Book>();
}
