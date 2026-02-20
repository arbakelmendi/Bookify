namespace PersonalLibrary.Api.Modules.Reading.Dtos;

public class UpdatePdfProgressDto
{
    public int CurrentPage { get; set; }
    public int? TotalPages { get; set; }
    public string? Status { get; set; }
}

