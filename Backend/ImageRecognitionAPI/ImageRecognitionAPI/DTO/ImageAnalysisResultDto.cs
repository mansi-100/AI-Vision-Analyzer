namespace ImageRecognitionAPI.DTO
{
	public class ImageAnalysisResultDto
	{
		public string LandmarkName { get; set; }
		public double LandmarkConfidence { get; set; }
		public IList<string> Descriptions { get; set; }
		public IList<string> Tags { get; set; }
		public IList<string> Objects { get; set; }
		// Add other properties as needed

		public ImageAnalysisResultDto()
		{
			Descriptions = new List<string>();
			Tags = new List<string>();
			Objects = new List<string>();
		}
	}

}
