using System.ComponentModel.DataAnnotations;

namespace PersonalLibrary.Api.Modules.UserBooks.Dtos;

public class AddUserBookDto
{
    [Required]
    public int BookId { get; set; }

    // "Reading" | "Completed" | "Planned"
    public string Status { get; set; } = "Planned";
}
