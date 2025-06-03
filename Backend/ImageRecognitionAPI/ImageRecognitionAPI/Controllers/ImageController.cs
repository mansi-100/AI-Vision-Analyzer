using ImageRecognitionAPI.DTO;
using ImageRecognitionAPI.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ImageRecognitionAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
	public class ImageController : ControllerBase
	{
		private readonly VisionService _visionService;

		public ImageController()
		{
			_visionService = new VisionService();
		}

		[HttpPost("analyze")]
		[Consumes("multipart/form-data")]
		public async Task<IActionResult> AnalyzeImage([FromForm] ImageUploadRequest request)
		{
			if (request.Image == null || request.Image.Length == 0)
				return BadRequest("No image uploaded.");

			using var stream = request.Image.OpenReadStream();
			if (!IsImageSignature(stream))
				return BadRequest("Uploaded file is not a valid image.");

			var result = await _visionService.AnalyzeImageAsync(stream);
			return Ok(result);
		}
		
		private bool IsImageSignature(Stream stream)
		{
			stream.Position = 0;
			byte[] buffer = new byte[4];
			stream.Read(buffer, 0, buffer.Length);
			stream.Position = 0;

			string hex = BitConverter.ToString(buffer).Replace("-", "").ToLower();

			// JPEG (FF D8 FF), PNG (89 50 4E 47), GIF (47 49 46 38), BMP (42 4D)
			return hex.StartsWith("ffd8ff") ||
				   hex.StartsWith("89504e47") ||
				   hex.StartsWith("47494638") ||
				   hex.StartsWith("424d");
		}

	}
}
