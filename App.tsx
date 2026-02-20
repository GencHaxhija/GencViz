import React, { useState } from 'react';
import { Upload, Sparkles, Layout, X, AlertCircle, Grid, Layers, MapPin } from 'lucide-react';
import { Button } from './components/Button';
import { PromptInput } from './components/PromptInput';
import { ComparisonView } from './components/ComparisonView';
import { CreativityControl } from './components/CreativityControl';
import { ImageEditor } from './components/ImageEditor';
import { SeasonSelector } from './components/SeasonSelector';
import { generateRendering, editImage } from './services/geminiService';
import { getSystemPrompt, SEASONAL_DATA } from './constants';
import { UploadedImage, RenderResult, AppStatus, CreativityLevel, EditingState, Season, BackgroundSuggestion } from './types';

const App: React.FC = () => {
  const [sceneDescription, setSceneDescription] = useState("");
  const [creativityLevel, setCreativityLevel] = useState<CreativityLevel>('strict');
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
        selectedBackground || undefined
      );

      const generatedImageUrls = await generateRendering(
        uploadedImage.base64, 
        fullPrompt, 
        apiKey, 
        variationCount,
        baseSeed
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

  const handleEditSave = async (maskBase64: string, prompt: string) => {
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

      const editedImageUrl = await editImage(maskBase64, enhancedPrompt, apiKey);
      
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Layout className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-white">ArchViz<span className="text-indigo-400">AI</span></h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Consistency Mode Active</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {!uploadedImage && (
          <div className="text-center mb-12 py-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              High-Consistency ArchViz
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
              Transform architectural sketches into photorealistic renders. Control the geometry, describe the scene, and generate consistent variations.
            </p>
            
            <div className="flex justify-center">
              <label className="group relative cursor-pointer">
                <div className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1">
                  <Upload className="w-5 h-5" />
                  <span>Upload Reference Image</span>
                </div>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        )}

        {uploadedImage && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-white">Configuration</h3>
                  <button onClick={handleReset} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear
                  </button>
                </div>

                {/* Variations Control */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Number of Renders
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 4].map((num) => (
                      <button
                        key={num}
                        onClick={() => setVariationCount(num)}
                        className={`py-2 rounded-lg border text-sm font-medium transition-all ${variationCount === num ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-700/50" />

                {/* Geometry/Creativity Control */}
                <CreativityControl 
                  value={creativityLevel}
                  onChange={setCreativityLevel}
                  disabled={status === AppStatus.GENERATING}
                />

                <div className="h-px bg-slate-700/50" />

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

                <div className="h-px bg-slate-700/50" />

                {/* Description Input */}
                <div className="space-y-2">
                   <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                      <span>Scene Description (What & Where)</span>
                   </div>
                   <textarea
                    value={sceneDescription}
                    onChange={(e) => setSceneDescription(e.target.value)}
                    disabled={status === AppStatus.GENERATING}
                    className="w-full h-24 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm leading-relaxed"
                    placeholder="e.g. The lake is visible through the left window. People are sitting at the round tables. Warm evening light coming from the right..."
                  />
                  <p className="text-xs text-slate-500">
                    Describe specific locations of elements and atmosphere.
                  </p>
                </div>

                <Button 
                  onClick={handleGenerate} 
                  className="w-full py-3 text-lg mt-2" 
                  isLoading={status === AppStatus.GENERATING}
                  icon={<Sparkles className="w-5 h-5" />}
                >
                  {status === AppStatus.GENERATING ? `Rendering...` : `Generate Renderings`}
                </Button>

                {error && (
                  <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-lg text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                    <p>{error}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-8 order-1 lg:order-2 space-y-6">
              <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-2 min-h-[600px] flex items-center justify-center relative">
                {status === AppStatus.IDLE || status === AppStatus.GENERATING ? (
                   <div className="w-full h-full min-h-[600px] bg-slate-900/50 rounded-xl overflow-hidden relative flex flex-col items-center justify-center p-8">
                      {status === AppStatus.GENERATING ? (
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto animate-bounce">
                            <Sparkles className="w-8 h-8 text-indigo-400" />
                          </div>
                          <p className="text-indigo-200 font-medium">Processing Architecture...</p>
                          <p className="text-slate-500 text-sm max-w-xs mx-auto">
                            Applying {creativityLevel} geometry rules and scene descriptions to {variationCount} variations.
                          </p>
                        </div>
                      ) : (
                         <div className="relative w-full h-full flex flex-col items-center justify-center">
                             <img src={uploadedImage.previewUrl} alt="Reference" className="max-h-[60vh] rounded-lg shadow-2xl" />
                             <div className="mt-6 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700 text-sm text-slate-300">
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
                         <div className="bg-indigo-600/10 border border-indigo-500/50 rounded-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-3 text-indigo-100">
                               <Sparkles className="w-5 h-5 text-indigo-400" />
                               <span className="font-semibold">Bearbeitung abgeschlossen! Wie möchtest du fortfahren?</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                               <Button onClick={handleAcceptEdit} className="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20">
                                  Änderung übernehmen
                                </Button>
                                <Button onClick={handleRequestAnotherEdit} variant="secondary" className="border-indigo-500/50 text-indigo-100">
                                  Weitere Änderung
                                </Button>
                                <Button onClick={handleRejectEdit} variant="secondary" className="border-red-500/50 text-red-200 hover:bg-red-500/10">
                                  Ablehnen / Zurück
                                </Button>
                            </div>
                         </div>
                       )}
                       
                       <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-300">
                             <Grid className="w-4 h-4" />
                             Batch Results
                          </div>
                          <div className="flex flex-wrap gap-4">
                             {result.imageUrls.map((url, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedVariationIndex(idx)}
                                  className={`relative w-20 h-20 md:w-28 md:h-28 rounded-lg overflow-hidden border-2 transition-all ${selectedVariationIndex === idx ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg' : 'border-slate-600 opacity-60 hover:opacity-100 hover:border-slate-500'}`}
                                >
                                   <img src={url} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover" />
                                   <div className="absolute top-1 left-1 bg-black/60 text-white text-[8px] px-1 rounded">#{idx + 1}</div>
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

      <footer className="border-t border-slate-800 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-600 text-[10px] uppercase tracking-widest">
          <p>Architectural AI Rendering Engine &bull; Gemini 2.5 Flash</p>
        </div>
      </footer>
    </div>
  );
};

export default App;