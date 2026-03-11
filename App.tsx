import React, { useState } from 'react';
import { Upload, Sparkles, Layout, X, AlertCircle, Grid, Layers, MapPin, Hexagon } from 'lucide-react';
import { Button } from './components/Button';
import { PromptInput } from './components/PromptInput';
import { ComparisonView } from './components/ComparisonView';
import { CreativityControl } from './components/CreativityControl';
import { ImageEditor } from './components/ImageEditor';
import { SeasonSelector } from './components/SeasonSelector';
import { StyleSelector } from './components/StyleSelector';
import { generateRendering, editImage } from './services/geminiService';
import { getSystemPrompt, SEASONAL_DATA } from './constants';
import { UploadedImage, RenderResult, AppStatus, CreativityLevel, EditingState, Season, BackgroundSuggestion, RenderingStyle } from './types';

const App: React.FC = () => {
  const [sceneDescription, setSceneDescription] = useState("");
  const [creativityLevel, setCreativityLevel] = useState<CreativityLevel>('strict');
  const [selectedStyle, setSelectedStyle] = useState<RenderingStyle>('photorealistic');
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [result, setResult] = useState<RenderResult | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [variationCount, setVariationCount] = useState<number>(2);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [comparisonReference, setComparisonReference] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundSuggestion | null>(null);
  const [pendingEdit, setPendingEdit] = useState<{ url: string, previousUrl: string } | null>(null);
  const [initialReferenceImage, setInitialReferenceImage] = useState<string | null>(null);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await readFileAsBase64(file);
      const newImage: UploadedImage = {
        id: Date.now().toString(),
        file,
        previewUrl: URL.createObjectURL(file),
        base64
      };
      setUploadedImage(newImage);
      setComparisonReference(newImage.previewUrl);
      setResult(null);
      setError(null);
      setStatus(AppStatus.IDLE);
      setSelectedVariationIndex(0);
    } catch (e) {
      console.error("File reading error", e);
      setError("Failed to read the file.");
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;

    setStatus(AppStatus.GENERATING);
    setError(null);

    try {
      const apiKey = process.env.API_KEY || '';
      if (!apiKey) {
        throw new Error("API_KEY not found in environment variables.");
      }

      // Generate a single random base seed for the whole batch to ensure consistency
      const baseSeed = Math.floor(Math.random() * 1000000);

      // Construct the prompt based on the slider level and user text
      const fullPrompt = getSystemPrompt(
        creativityLevel, 
        sceneDescription, 
        selectedSeason || undefined, 
        selectedBackground || undefined,
        selectedStyle
      );

      const generatedImageUrls = await generateRendering(
        uploadedImage.base64, 
        fullPrompt, 
        apiKey, 
        variationCount,
        baseSeed,
        initialReferenceImage || undefined
      );

      const newResult: RenderResult = {
        id: Date.now().toString(),
        originalImageId: uploadedImage.id,
        imageUrls: generatedImageUrls,
        prompt: fullPrompt,
        timestamp: Date.now(),
      };

      setResult(newResult);
      setComparisonReference(uploadedImage.previewUrl);
      setSelectedVariationIndex(0);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      setStatus(AppStatus.ERROR);
      setError(err.message || "An unexpected error occurred during generation.");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.imageUrls[selectedVariationIndex];
    link.download = `archviz-render-${result.id}-var${selectedVariationIndex + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartEditing = () => {
    if (!result) return;
    setEditingState({
      originalUrl: result.imageUrls[selectedVariationIndex],
      editPrompt: ""
    });
    setStatus(AppStatus.EDITING);
  };

  const handleEditSave = async (maskBase64: string, prompt: string, referenceImage?: string) => {
    if (!editingState || !result) return;
    if (!maskBase64) {
      setError("Kein Bild für die Bearbeitung gefunden.");
      return;
    }
    
    setStatus(AppStatus.GENERATING);
    setError(null);

    try {
      const apiKey = process.env.API_KEY || '';
      if (!apiKey) throw new Error("API Key fehlt.");

      // We send the image WITH the mask drawn on it.
      // We tell Gemini that the purple/indigo area is the selection.
      const enhancedPrompt = `
        INSTRUCTIONS:
        1. Look at the provided image.
        2. There is an area marked with a semi-transparent purple/indigo color.
        3. This marked area is the selection that needs to be edited.
        4. TASK: ${prompt}
        5. Keep everything outside the marked area exactly as it is.
        6. Output only the final edited image without the purple marking.
      `;

      const editedImageUrl = await editImage(maskBase64, enhancedPrompt, apiKey, referenceImage);
      
      const previousUrl = result.imageUrls[selectedVariationIndex];
      setPendingEdit({ url: editedImageUrl, previousUrl });
      setComparisonReference(previousUrl);
      setStatus(AppStatus.SUCCESS);
      setEditingState(null);
    } catch (err: any) {
      console.error("Edit error:", err);
      setStatus(AppStatus.ERROR);
      setError(err.message || "Fehler beim Anwenden der Bearbeitung.");
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setComparisonReference(null);
    setSelectedSeason(null);
    setSelectedBackground(null);
    setPendingEdit(null);
    setResult(null);
    setStatus(AppStatus.IDLE);
    setError(null);
    setSelectedVariationIndex(0);
  };

  const handleAcceptEdit = () => {
    if (!pendingEdit || !result) return;
    const newImageUrls = [...result.imageUrls];
    newImageUrls[selectedVariationIndex] = pendingEdit.url;
    setResult({ ...result, imageUrls: newImageUrls });
    setPendingEdit(null);
  };

  const handleRejectEdit = () => {
    if (!pendingEdit) return;
    setComparisonReference(null); // Or keep it? User said "reject", so we go back.
    setPendingEdit(null);
  };

  const handleRequestAnotherEdit = () => {
    if (!pendingEdit) return;
    // Keep the pending edit as the new base for further editing
    const newImageUrls = [...result!.imageUrls];
    newImageUrls[selectedVariationIndex] = pendingEdit.url;
    setResult({ ...result!, imageUrls: newImageUrls });
    setPendingEdit(null);
    handleStartEditing();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-sky-300 to-indigo-300 p-2.5 rounded-2xl text-white shadow-lg shadow-sky-200/50 transform rotate-3 hover:rotate-6 transition-transform">
              <Hexagon className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-slate-700 to-slate-500 bg-clip-text text-transparent font-serif italic">Genc<span className="text-sky-400 not-italic font-sans">Viz</span></h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-bold ml-0.5">Architecture Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-sky-50 rounded-full border border-sky-100">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-sky-700">System Ready</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {!uploadedImage ? (
          <div className="max-w-2xl mx-auto text-center space-y-8 py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 text-sky-600 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                <span>Next-Gen Architectural Visualization</span>
              </div>
              <h2 className="text-5xl font-bold text-slate-800 tracking-tight leading-tight">
                Transform Sketches into <br/>
                <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Photorealistic Art</span>
              </h2>
              <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
                GencViz transforms architectural sketches into photorealistic renders. Control the geometry, describe the scene, and generate consistent variations.
              </p>
            </div>
            
            <div className="flex justify-center">
              <label className="group relative cursor-pointer">
                <div className="flex items-center gap-3 bg-sky-400 hover:bg-sky-300 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl shadow-sky-200 transition-all duration-300 transform hover:-translate-y-1">
                  <Upload className="w-5 h-5" />
                  <span>Upload Reference Image</span>
                </div>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-slate-800">Configuration</h3>
                  <button onClick={handleReset} className="text-xs text-slate-400 hover:text-sky-500 flex items-center gap-1 transition-colors">
                    <X className="w-3 h-3" /> Clear
                  </button>
                </div>

                {/* Variations Control */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    Number of Renders
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 4].map((num) => (
                      <button
                        key={num}
                        onClick={() => setVariationCount(num)}
                        className={`py-2 rounded-xl border text-sm font-medium transition-all ${variationCount === num ? 'bg-sky-100 border-sky-300 text-sky-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Geometry/Creativity Control */}
                <CreativityControl 
                  value={creativityLevel}
                  onChange={setCreativityLevel}
                  disabled={status === AppStatus.GENERATING}
                />

                <div className="h-px bg-slate-100" />

                {/* Seasonal Presets */}
                <SeasonSelector 
                  selectedSeason={selectedSeason}
                  selectedBackground={selectedBackground}
                  onSeasonChange={(s) => {
                    setSelectedSeason(s);
                    setSelectedBackground(SEASONAL_DATA[s].suggestions[0]);
                  }}
                  onBackgroundChange={setSelectedBackground}
                />

                <div className="h-px bg-slate-100" />

                {/* Style Selection */}
                <StyleSelector 
                  selectedStyle={selectedStyle}
                  onStyleChange={setSelectedStyle}
                  disabled={status === AppStatus.GENERATING}
                />

                <div className="h-px bg-slate-100" />

                {/* Description Input */}
                <PromptInput 
                  value={sceneDescription} 
                  onChange={setSceneDescription} 
                  disabled={status === AppStatus.GENERATING}
                  onReferenceImageChange={setInitialReferenceImage}
                />

                <Button 
                  onClick={handleGenerate} 
                  className="w-full py-3 text-lg mt-2 bg-sky-400 hover:bg-sky-300 text-white shadow-lg shadow-sky-200 rounded-xl" 
                  isLoading={status === AppStatus.GENERATING}
                  icon={<Sparkles className="w-5 h-5" />}
                >
                  {status === AppStatus.GENERATING ? `Rendering...` : `Generate Renderings`}
                </Button>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                    <p>{error}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-8 order-1 lg:order-2 space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-2 min-h-[600px] flex items-center justify-center relative shadow-sm">
                {status === AppStatus.IDLE || status === AppStatus.GENERATING ? (
                   <div className="w-full h-full min-h-[600px] bg-slate-50 rounded-2xl overflow-hidden relative flex flex-col items-center justify-center p-8">
                      {status === AppStatus.GENERATING ? (
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                            <Sparkles className="w-8 h-8 text-sky-400" />
                          </div>
                          <p className="text-slate-500 font-medium animate-pulse">Creating your masterpiece...</p>
                        </div>
                      ) : (
                         <div className="relative w-full h-full flex flex-col items-center justify-center">
                             <img src={uploadedImage.previewUrl} alt="Reference" className="max-h-[60vh] rounded-xl shadow-xl" />
                             <div className="mt-6 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-slate-200 text-sm text-slate-500 shadow-sm">
                               Reference Loaded
                             </div>
                         </div>
                      )}
                   </div>
                ) : status === AppStatus.EDITING && editingState ? (
                  <ImageEditor 
                    imageUrl={editingState.originalUrl}
                    onSave={handleEditSave}
                    onCancel={() => {
                      setStatus(AppStatus.SUCCESS);
                      setEditingState(null);
                    }}
                    isProcessing={status === AppStatus.GENERATING}
                  />
                ) : (
                  result && (
                    <div className="w-full flex flex-col gap-4">
                       <ComparisonView 
                          original={comparisonReference || uploadedImage.previewUrl}
                          generated={pendingEdit ? pendingEdit.url : result.imageUrls[selectedVariationIndex]}
                          onDownload={handleDownload}
                          onEdit={handleStartEditing}
                       />

                       {pendingEdit && (
                         <div className="bg-sky-50 border border-sky-100 rounded-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-3 text-sky-800">
                               <Sparkles className="w-5 h-5 text-sky-500" />
                               <span className="font-semibold">Bearbeitung abgeschlossen! Wie möchtest du fortfahren?</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                               <Button onClick={handleAcceptEdit} className="bg-emerald-400 hover:bg-emerald-300 text-white shadow-emerald-200">
                                  Änderung übernehmen
                                </Button>
                                <Button onClick={handleRequestAnotherEdit} variant="secondary" className="bg-white border-sky-200 text-sky-600 hover:bg-sky-50">
                                  Weitere Änderung
                                </Button>
                                <Button onClick={handleRejectEdit} variant="secondary" className="bg-white border-red-200 text-red-500 hover:bg-red-50">
                                  Ablehnen / Zurück
                                </Button>
                            </div>
                         </div>
                       )}
                       
                       <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-500">
                             <Grid className="w-4 h-4" />
                             Batch Results
                          </div>
                          <div className="flex flex-wrap gap-4">
                             {result.imageUrls.map((url, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedVariationIndex(idx)}
                                  className={`relative w-20 h-20 md:w-28 md:h-28 rounded-xl overflow-hidden border-2 transition-all ${selectedVariationIndex === idx ? 'border-sky-400 ring-2 ring-sky-200 shadow-md' : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-sky-300'}`}
                                >
                                   <img src={url} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover" />
                                   <div className="absolute top-1 left-1 bg-white/80 backdrop-blur text-slate-700 text-[8px] px-1.5 py-0.5 rounded-md font-bold">#{idx + 1}</div>
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 py-8 mt-auto bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">
            GencViz &bull; Powered by Gemini 2.5 Flash
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;