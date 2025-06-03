using Microsoft.Azure.CognitiveServices.Vision.ComputerVision;
using Microsoft.Azure.CognitiveServices.Vision.ComputerVision.Models;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System;
using System.Text;
using System.Net.Http;
using System.Threading.Tasks;
using System.IO;
using ImageRecognitionAPI.DTO;

namespace ImageRecognitionAPI.Services
{
	public class VisionService
	{
		private readonly string subscriptionKey = "8mtG58deU3XbmCfs42NGKOnmDG1a31jWpLQy6ih2adpYFtrz70tYJQQJ99BFACYeBjFXJ3w3AAAFACOGE7if";
		private readonly string endpoint = "https://imagerecognition1231.cognitiveservices.azure.com/";
		private readonly HttpClient httpClient;

		public VisionService()
		{
			httpClient = new HttpClient();
		}

		public async Task<EnhancedImageAnalysisResultDto> AnalyzeImageAsync(Stream imageStream)
		{
			// Read the input stream into a byte array
			byte[] buffer;
			using (var ms = new MemoryStream())
			{
				await imageStream.CopyToAsync(ms);
				buffer = ms.ToArray();
			}

			var client = new ComputerVisionClient(new ApiKeyServiceClientCredentials(subscriptionKey))
			{
				Endpoint = endpoint
			};

			// Use a new MemoryStream for the first call
			using (var streamForDomain = new MemoryStream(buffer))
			{
				var domainResults = await client.AnalyzeImageByDomainInStreamAsync("landmarks", streamForDomain);
				var jsonResult = domainResults.Result as JObject;

				string landmarkName = null;
				double landmarkConfidence = 0;

				if (jsonResult != null && jsonResult["landmarks"] != null && jsonResult["landmarks"].HasValues)
				{
					var landmark = jsonResult["landmarks"][0];
					landmarkName = landmark["name"]?.ToString();
					landmarkConfidence = landmark["confidence"]?.ToObject<double>() ?? 0;
				}

				// Use a new MemoryStream for the second call
				using (var streamForAnalysis = new MemoryStream(buffer))
				{
					var features = new List<VisualFeatureTypes?>
					{
						VisualFeatureTypes.Description,
						VisualFeatureTypes.Tags,
						VisualFeatureTypes.Objects,
						VisualFeatureTypes.Categories,
						VisualFeatureTypes.Faces,
						VisualFeatureTypes.Color,
						VisualFeatureTypes.ImageType
					};

					var analysisResult = await client.AnalyzeImageInStreamAsync(streamForAnalysis, features);

					var dto = new EnhancedImageAnalysisResultDto
					{
						LandmarkName = landmarkName,
						LandmarkConfidence = landmarkConfidence
					};

					// Populate basic analysis data
					if (analysisResult.Description?.Captions != null)
					{
						foreach (var caption in analysisResult.Description.Captions)
						{
							dto.Descriptions.Add($"{caption.Text} ({caption.Confidence:P})");
						}
					}

					if (analysisResult.Tags != null)
					{
						foreach (var tag in analysisResult.Tags)
						{
							dto.Tags.Add($"{tag.Name} ({tag.Confidence:P})");
						}
					}

					if (analysisResult.Objects != null)
					{
						foreach (var obj in analysisResult.Objects)
						{
							dto.Objects.Add($"{obj.ObjectProperty} ({obj.Confidence:P})");
						}
					}

					// Enhanced location search
					await EnhanceWithLocationData(dto, landmarkName, analysisResult);

					return dto;
				}
			}
		}

		private async Task EnhanceWithLocationData(EnhancedImageAnalysisResultDto dto, string landmarkName, ImageAnalysis analysisResult)
		{
			// First, try to search based on detected landmark
			if (!string.IsNullOrEmpty(landmarkName))
			{
				var landmarkInfo = await SearchWikipedia(landmarkName);
				if (landmarkInfo != null)
				{
					dto.LocationInfo = landmarkInfo;
					return;
				}
			}

			// If no landmark, try searching based on image descriptions and tags
			var searchTerms = new List<string>();

			// Add significant tags (architectural, geographical terms)
			if (analysisResult.Tags != null)
			{
				foreach (var tag in analysisResult.Tags)
				{
					if (IsLocationRelevantTag(tag.Name) && tag.Confidence > 0.7)
					{
						searchTerms.Add(tag.Name);
					}
				}
			}

			// Add description terms
			if (analysisResult.Description?.Captions != null)
			{
				foreach (var caption in analysisResult.Description.Captions)
				{
					var words = ExtractLocationKeywords(caption.Text);
					searchTerms.AddRange(words);
				}
			}

			// Try searching with combined terms
			foreach (var term in searchTerms.Take(3)) // Limit searches
			{
				var locationInfo = await SearchWikipedia(term);
				if (locationInfo != null)
				{
					dto.LocationInfo = locationInfo;
					break;
				}

				// Fallback to other sources if Wikipedia fails
				locationInfo = await SearchAlternativeSources(term);
				if (locationInfo != null)
				{
					dto.LocationInfo = locationInfo;
					break;
				}
			}
		}

		private async Task<LocationInfoDto> SearchWikipedia(string searchTerm)
		{
			try
			{
				// Wikipedia API search
				var searchUrl = $"https://en.wikipedia.org/api/rest_v1/page/summary/{Uri.EscapeDataString(searchTerm)}";
				var response = await httpClient.GetAsync(searchUrl);

				if (response.IsSuccessStatusCode)
				{
					var content = await response.Content.ReadAsStringAsync();
					var json = JObject.Parse(content);

					// Check if it's a valid page (not disambiguation)
					if (json["type"]?.ToString() == "standard" && json["coordinates"] != null)
					{
						return new LocationInfoDto
						{
							Name = json["title"]?.ToString(),
							Description = json["extract"]?.ToString(),
							Latitude = json["coordinates"]?["lat"]?.ToObject<double>(),
							Longitude = json["coordinates"]?["lon"]?.ToObject<double>(),
							Source = "Wikipedia",
							Url = json["content_urls"]?["desktop"]?["page"]?.ToString(),
							ThumbnailUrl = json["thumbnail"]?["source"]?.ToString()
						};
					}
				}
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Wikipedia search failed for {searchTerm}: {ex.Message}");
			}

			return null;
		}

		private async Task<LocationInfoDto> SearchAlternativeSources(string searchTerm)
		{
			try
			{
				// Try Wikidata as alternative
				var wikidataUrl = $"https://www.wikidata.org/w/api.php?action=wbsearchentities&search={Uri.EscapeDataString(searchTerm)}&language=en&format=json&limit=1";
				var response = await httpClient.GetAsync(wikidataUrl);

				if (response.IsSuccessStatusCode)
				{
					var content = await response.Content.ReadAsStringAsync();
					var json = JObject.Parse(content);
					var results = json["search"] as JArray;

					if (results != null && results.Count > 0)
					{
						var item = results[0];
						return new LocationInfoDto
						{
							Name = item["label"]?.ToString(),
							Description = item["description"]?.ToString(),
							Source = "Wikidata",
							Url = item["concepturi"]?.ToString()
						};
					}
				}
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Alternative search failed for {searchTerm}: {ex.Message}");
			}

			return null;
		}

		private bool IsLocationRelevantTag(string tagName)
		{
			var locationTags = new[]
			{
				"building", "architecture", "monument", "statue", "church", "temple", "mosque",
				"palace", "castle", "tower", "bridge", "landmark", "historic", "ancient",
				"cathedral", "museum", "memorial", "plaza", "square", "fountain", "gate"
			};

			return locationTags.Any(tag => tagName.ToLower().Contains(tag));
		}

		private List<string> ExtractLocationKeywords(string text)
		{
			var keywords = new List<string>();
			var locationKeywords = new[]
			{
				"statue", "monument", "building", "church", "temple", "palace", "castle",
				"tower", "bridge", "cathedral", "museum", "memorial", "fountain", "gate"
			};

			var words = text.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);
			foreach (var word in words)
			{
				if (locationKeywords.Contains(word))
				{
					keywords.Add(word);
				}
			}

			return keywords;
		}

		public void Dispose()
		{
			httpClient?.Dispose();
		}
	}

	// Enhanced DTO classes
	public class EnhancedImageAnalysisResultDto
	{
		public string LandmarkName { get; set; }
		public double LandmarkConfidence { get; set; }
		public List<string> Descriptions { get; set; } = new List<string>();
		public List<string> Tags { get; set; } = new List<string>();
		public List<string> Objects { get; set; } = new List<string>();
		public LocationInfoDto LocationInfo { get; set; }
	}

	public class LocationInfoDto
	{
		public string Name { get; set; }
		public string Description { get; set; }
		public double? Latitude { get; set; }
		public double? Longitude { get; set; }
		public string Source { get; set; }
		public string Url { get; set; }
		public string ThumbnailUrl { get; set; }
		public string Country { get; set; }
		public string City { get; set; }
	}
}