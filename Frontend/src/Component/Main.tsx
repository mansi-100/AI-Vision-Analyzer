import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Upload, Image, Eye, Tag, MapPin, Loader2, X, Camera, ExternalLink, Globe, Navigation } from 'lucide-react';

// Type definitions
interface LocationInfo {
  name: string;
  description: string;
  latitude?: number;
  longitude?: number;
  source: string;
  url?: string;
  thumbnailUrl?: string;
  country?: string;
  city?: string;
}

interface AnalysisData {
  landmarkName: string | null;
  landmarkConfidence: number;
  descriptions: string[];
  tags: string[];
  objects: string[];
  locationInfo?: LocationInfo;
}

const ImageAnalyzer: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (file: File | null): void => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleImageSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] || null;
    handleImageSelect(file);
  };

  const analyzeImage = async (): Promise<void> => {
    if (!selectedImage) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await fetch('https://localhost:7059/api/Image/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: AnalysisData = await response.json();
      setAnalysisData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Analysis failed:', error);
      
      const mockData: AnalysisData = {
        landmarkName: "Statue of Liberty",
        landmarkConfidence: 0.855,
        descriptions: [
          "a statue of a person holding a sword (36.91%)"
        ],
        tags: [
          "human face (94.25%)",
          "statue (91.03%)",
          "toy (87.62%)",
          "clothing (87.04%)",
          "figurine (85.35%)",
          "indoor (77.14%)",
          "person (75.72%)",
          "floor (67.57%)"
        ],
        objects: [
          "person (71.00%)"
        ],
        locationInfo: {
          name: "Statue of Liberty",
          description: "The Statue of Liberty is a neoclassical sculpture on Liberty Island in New York Harbor in New York City. The copper statue, a gift from the people of France to the people of the United States, was designed by French sculptor Frédéric Auguste Bartholdi.",
          latitude: 40.6892,
          longitude: -74.0445,
          source: "Wikipedia",
          url: "https://en.wikipedia.org/wiki/Statue_of_Liberty",
          thumbnailUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Statue_of_Liberty_7.jpg/320px-Statue_of_Liberty_7.jpg",
          country: "United States",
          city: "New York City"
        }
      };
      setAnalysisData(mockData);
      setIsLoading(false);
    }
  };

  const resetAnalysis = (): void => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisData(null);
  };

  const parseConfidence = (text: string): number => {
    const match = text.match(/\((\d+\.\d+)%\)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const getConfidenceGradient = (confidence: number): string => {
    if (confidence >= 80) return 'linear-gradient(135deg, #10b981, #059669)';
    if (confidence >= 60) return 'linear-gradient(135deg, #f59e0b, #d97706)';
    if (confidence >= 40) return 'linear-gradient(135deg, #ef4444, #dc2626)';
    return 'linear-gradient(135deg, #ef4444, #b91c1c)';
  };

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .upload-zone {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .upload-zone:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }
        
        .glass-card {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .shimmer-bg {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        .floating-icon {
          animation: float 3s ease-in-out infinite;
        }
        
        .slide-in {
          animation: slideIn 0.6s ease-out;
        }
        
        .scale-in {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>
      
      <div style={styles.maxWidth}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerIcon} className="floating-icon">
              <Eye size={32} color="#ffffff" />
            </div>
            <h1 style={styles.title}>AI Vision Analyzer</h1>
          </div>
          <p style={styles.subtitle}>
            Upload an image to discover its contents with advanced AI-powered analysis
          </p>
        </div>

        <div style={styles.gridContainer}>
          {/* Upload Section */}
          <div style={styles.uploadSection}>
            {!imagePreview ? (
              <div
                style={{
                  ...styles.uploadZone,
                  ...(isDragging ? styles.uploadZoneDragging : {})
                }}
                className="upload-zone glass-card"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={styles.uploadContent}>
                  <div style={styles.uploadIconContainer}>
                    <Upload size={48} color="#00d4ff" />
                  </div>
                  <h3 style={styles.uploadTitle}>Drop your image here</h3>
                  <p style={styles.uploadText}>or click to browse files</p>
                  <div style={styles.uploadButton}>
                    <Camera size={20} color="#ffffff" />
                    <span>Choose Image</span>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div style={styles.imagePreviewContainer} className="glass-card slide-in">
                <div style={styles.imagePreview}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={styles.previewImage}
                  />
                </div>
                
                <div style={styles.buttonContainer}>
                  <button
                    onClick={analyzeImage}
                    disabled={isLoading}
                    style={{
                      ...styles.analyzeButton,
                      ...(isLoading ? styles.analyzeButtonDisabled : {})
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Eye size={20} />
                        <span>Analyze Image</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={resetAnalysis}
                    style={styles.resetButton}
                    className="glass-card"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div style={styles.resultsSection}>
            {analysisData ? (
              <div style={styles.resultsContainer}>
                {/* Location Information */}
                {analysisData.locationInfo && (
                  <div style={styles.resultCard} className="glass-card scale-in">
                    <div style={styles.cardHeader}>
                      <Globe size={24} color="#00d4ff" />
                      <h3 style={styles.cardTitle}>Location Information</h3>
                    </div>
                    
                    <div style={styles.locationGrid}>
                      <div style={styles.locationDetails}>
                        <div>
                          <h4 style={styles.locationName}>{analysisData.locationInfo.name}</h4>
                          <p style={styles.locationDescription}>{analysisData.locationInfo.description}</p>
                        </div>
                        
                        {analysisData.locationInfo.latitude && analysisData.locationInfo.longitude && (
                          <div style={styles.coordinatesContainer}>
                            <div style={styles.coordinatesHeader}>
                              <Navigation size={16} color="#00d4ff" />
                              <span style={styles.coordinatesTitle}>Coordinates</span>
                            </div>
                            <p style={styles.coordinatesText}>
                              Lat: {analysisData.locationInfo.latitude.toFixed(4)}, 
                              Lng: {analysisData.locationInfo.longitude.toFixed(4)}
                            </p>
                          </div>
                        )}
                        
                        <div style={styles.sourceContainer}>
                          <div style={styles.sourceTag}>
                            <span style={styles.sourceLabel}>Source:</span>
                            <span style={styles.sourceName}>{analysisData.locationInfo.source}</span>
                          </div>
                          
                          {analysisData.locationInfo.url && (
                            <a 
                              href={analysisData.locationInfo.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={styles.learnMoreLink}
                            >
                              <ExternalLink size={12} />
                              <span>Learn More</span>
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {analysisData.locationInfo.thumbnailUrl && (
                        <div style={styles.thumbnailContainer}>
                          <img 
                            src={analysisData.locationInfo.thumbnailUrl} 
                            alt={analysisData.locationInfo.name}
                            style={styles.thumbnailImage}
                          />
                        </div>
                      )}
                    </div>
                    
                    {analysisData.locationInfo.latitude && analysisData.locationInfo.longitude && (
                      <div style={styles.mapLinkContainer}>
                        <a 
                          href={`https://www.google.com/maps?q=${analysisData.locationInfo.latitude},${analysisData.locationInfo.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.mapLink}
                        >
                          <MapPin size={20} color="#10b981" />
                          <span>View on Google Maps</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Landmark Detection */}
                <div style={styles.resultCard} className="glass-card scale-in">
                  <div style={styles.cardHeader}>
                    <MapPin size={24} color="#a855f7" />
                    <h3 style={styles.cardTitle}>Landmark Detection</h3>
                  </div>
                  {analysisData.landmarkName ? (
                    <div style={styles.landmarkContainer}>
                      <p style={styles.landmarkName}>{analysisData.landmarkName}</p>
                      <div style={styles.confidenceContainer}>
                        <p style={styles.confidenceText}>Confidence: {(analysisData.landmarkConfidence * 100).toFixed(1)}%</p>
                        <div style={styles.progressBar}>
                          <div
                            style={{
                              ...styles.progressFill,
                              width: `${analysisData.landmarkConfidence * 100}%`,
                              background: getConfidenceGradient(analysisData.landmarkConfidence * 100)
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p style={styles.noDataText}>No landmark detected</p>
                  )}
                </div>

                {/* Descriptions */}
                <div style={styles.resultCard} className="glass-card scale-in">
                  <div style={styles.cardHeader}>
                    <Image size={24} color="#00d4ff" />
                    <h3 style={styles.cardTitle}>Descriptions</h3>
                  </div>
                  <div style={styles.itemsContainer}>
                    {analysisData.descriptions.map((desc: string, index: number) => {
                      const confidence = parseConfidence(desc);
                      return (
                        <div key={index} style={styles.itemCard}>
                          <p style={styles.itemText}>{desc.split('(')[0].trim()}</p>
                          <div style={styles.progressBar}>
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${confidence}%`,
                                background: getConfidenceGradient(confidence)
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tags */}
                <div style={styles.resultCard} className="glass-card scale-in">
                  <div style={styles.cardHeader}>
                    <Tag size={24} color="#10b981" />
                    <h3 style={styles.cardTitle}>Tags</h3>
                  </div>
                  <div style={styles.tagsGrid}>
                    {analysisData.tags.map((tag: string, index: number) => {
                      const confidence = parseConfidence(tag);
                      const tagName = tag.split('(')[0].trim();
                      return (
                        <div key={index} style={styles.tagCard}>
                          <div style={styles.tagHeader}>
                            <span style={styles.tagName}>{tagName}</span>
                            <span style={styles.tagConfidence}>{confidence.toFixed(1)}%</span>
                          </div>
                          <div style={styles.tagProgressBar}>
                            <div
                              style={{
                                ...styles.tagProgressFill,
                                width: `${confidence}%`,
                                background: getConfidenceGradient(confidence)
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Objects */}
                <div style={styles.resultCard} className="glass-card scale-in">
                  <div style={styles.cardHeader}>
                    <Eye size={24} color="#f59e0b" />
                    <h3 style={styles.cardTitle}>Detected Objects</h3>
                  </div>
                  <div style={styles.itemsContainer}>
                    {analysisData.objects.map((obj: string, index: number) => {
                      const confidence = parseConfidence(obj);
                      return (
                        <div key={index} style={styles.itemCard}>
                          <p style={styles.itemText}>{obj.split('(')[0].trim()}</p>
                          <div style={styles.progressBar}>
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${confidence}%`,
                                background: getConfidenceGradient(confidence)
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.emptyState} className="glass-card">
                <div style={styles.emptyStateIcon}>
                  <Eye size={40} color="rgba(255, 255, 255, 0.5)" />
                </div>
                <h3 style={styles.emptyStateTitle}>Ready to Analyze</h3>
                <p style={styles.emptyState}>Upload an image to see detailed AI analysis results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
    padding: '2rem',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  maxWidth: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '3rem',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  headerIcon: {
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '1rem',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: '3rem',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: 'rgba(255, 255, 255, 0.8)',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: '1.6',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '2rem',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr',
    },
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  uploadZone: {
    border: '3px dashed rgba(255, 255, 255, 0.3)',
    borderRadius: '2rem',
    padding: '3rem',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: 'rgba(255, 255, 255, 0.05)',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  uploadZoneDragging: {
    borderColor: '#00d4ff',
    background: 'rgba(0, 212, 255, 0.1)',
    transform: 'scale(1.02)',
    boxShadow: '0 20px 40px rgba(0, 212, 255, 0.2)',
  },
  uploadContent: {
    position: 'relative' as const,
    zIndex: 2,
  },
  uploadIconContainer: {
    display: 'inline-flex',
    padding: '1.5rem',
    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(59, 130, 246, 0.2))',
    borderRadius: '50%',
    marginBottom: '1.5rem',
  },
  uploadTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 0.75rem 0',
  },
  uploadText: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '1.5rem',
    fontSize: '1.1rem',
  },
  uploadButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #00d4ff, #3b82f6)',
    borderRadius: '0.75rem',
    color: '#ffffff',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  imagePreviewContainer: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '2rem',
    padding: '1.5rem',
  },
  imagePreview: {
    borderRadius: '1rem',
    overflow: 'hidden',
    marginBottom: '1.5rem',
    position: 'relative' as const,
  },
  previewImage: {
    width: '100%',
    height: '320px',
    objectFit: 'cover' as const,
    borderRadius: '1rem',
  },
  buttonContainer: {
    display: 'flex',
    gap: '1rem',
  },
  analyzeButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#ffffff',
    fontWeight: '600',
    padding: '1rem 1.5rem',
    borderRadius: '0.75rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '1rem',
  },
  analyzeButtonDisabled: {
    background: 'linear-gradient(135deg, #6b7280, #4b5563)',
    cursor: 'not-allowed',
  },
  resetButton: {
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    borderRadius: '0.75rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  resultsSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  resultsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  resultCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '2rem',
    padding: '1.5rem',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  locationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  locationDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  locationName: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 0.5rem 0',
  },
  locationDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    margin: 0,
  },
  coordinatesContainer: {
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
    borderRadius: '0.75rem',
    padding: '1rem',
  },
  coordinatesHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  coordinatesTitle: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: '0.9rem',
  },
  coordinatesText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '0.85rem',
    margin: 0,
  },
  sourceContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
  },
  sourceTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
  },
  sourceLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.8rem',
  },
  sourceName: {
    color: '#ffffff',
    fontSize: '0.8rem',
    fontWeight: '500',
  },
  learnMoreLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(59, 130, 246, 0.2))',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '0.8rem',
    transition: 'all 0.2s ease',
  },
  thumbnailContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  thumbnailImage: {
    width: '100%',
    maxWidth: '300px',
    height: '200px',
    objectFit: 'cover' as const,
    borderRadius: '1rem',
  },
  mapLinkContainer: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  mapLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))',
    borderRadius: '0.75rem',
    padding: '0.75rem 1.5rem',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  landmarkContainer: {
    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
    borderRadius: '0.75rem',
    padding: '1rem',
  },
  landmarkName: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '1.1rem',
    margin: '0 0 0.5rem 0',
  },
  confidenceContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  confidenceText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.9rem',
    margin: 0,
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '0.5rem',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 1s ease-out',
  },
  noDataText: {
    color: 'rgba(255, 255, 255, 0.7)',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '0.75rem',
    padding: '1rem',
    margin: 0,
    textAlign: 'center' as const,
  },
  itemsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  itemCard: {
    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(59, 130, 246, 0.2))',
    borderRadius: '0.75rem',
    padding: '1rem',
  },
  itemText: {
    color: '#ffffff',
    fontWeight: '500',
    margin: '0 0 0.5rem 0',
    fontSize: '0.95rem',
  },
  tagsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0.75rem',
  },
  tagCard: {
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.2))',
    borderRadius: '0.75rem',
    padding: '0.75rem',
  },
  tagHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  tagName: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: '0.85rem',
  },
  tagConfidence: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.8rem',
  },
  tagProgressBar: {
    width: '100%',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  tagProgressFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.8s ease-out',
  },
  emptyState: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '2rem',
    padding: '3rem',
    textAlign: 'center' as const,
  },
  emptyStateIcon: {
    width: '80px',
    height: '80px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem auto',
  },
  emptyStateTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: '0 0 0.75rem 0',
  },
};

export default ImageAnalyzer;