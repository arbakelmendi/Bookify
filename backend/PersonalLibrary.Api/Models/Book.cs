using System.ComponentModel.DataAnnotations;

namespace PersonalLibrary.Api.Models;

public class Book
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Author { get; set; }

    public int? Year { get; set; }
}

