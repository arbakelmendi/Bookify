namespace PersonalLibrary.Api.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = null!; // unique
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Book> Books { get; set; } = new List<Book>();
}