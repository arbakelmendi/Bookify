using System.ComponentModel.DataAnnotations;

namespace PersonalLibrary.Api.Modules.UserBooks.Dtos;

public class UpdateUserBookStatusDto
{
    [Required]
    public string Status { get; set; } = "Reading";

    public int? TotalPages { get; set; }
    public int? CurrentPage { get; set; }
}
