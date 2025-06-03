using Microsoft.AspNetCore.Mvc;

namespace ImageRecognitionAPI.DTO
{
	public class ImageUploadRequest
	{
		[FromForm]
		public IFormFile Image { get; set; }
	}
}
