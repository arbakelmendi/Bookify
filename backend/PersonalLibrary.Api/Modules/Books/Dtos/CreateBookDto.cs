using System.ComponentModel.DataAnnotations;

namespace PersonalLibrary.Api.Modules.Books.Dtos;

public class CreateBookDto
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Author { get; set; }

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string CoverImageUrl { get; set; } = string.Empty;

    public int? Year { get; set; }
}
