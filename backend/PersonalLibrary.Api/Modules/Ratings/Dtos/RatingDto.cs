namespace PersonalLibrary.Api.Modules.Ratings.Dtos;

public class RatingSummaryDto
{
    public double Average { get; set; }
    public int Count { get; set; }
}

public class MyRatingDto
{
    public int? Value { get; set; }
}