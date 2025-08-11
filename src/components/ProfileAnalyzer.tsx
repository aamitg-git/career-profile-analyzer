import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Brain, AlertCircle, Upload, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileProcessor, type FileUploadResult } from '@/utils/fileProcessor';
import type { AnalysisData } from '@/pages/Index';

interface ProfileAnalyzerProps {
  onAnalysisComplete: (data: AnalysisData) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
}

export const ProfileAnalyzer: React.FC<ProfileAnalyzerProps> = ({
  onAnalysisComplete,
  isAnalyzing,
  setIsAnalyzing,
}) => {
  const [profile, setProfile] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [model, setModel] = useState('llama3.2');
  const [uploadedFile, setUploadedFile] = useState<FileUploadResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    
    try {
      const result = await FileProcessor.processFile(file);
      
      if (result.error) {
        toast({
          title: "File Processing Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setUploadedFile(result);
        setProfile(result.text);
        toast({
          title: "File Uploaded",
          description: `Successfully processed ${result.filename}`,
        });
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to process the uploaded file",
        variant: "destructive",
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setProfile('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeProfile = async () => {
    const profileText = profile.trim() || uploadedFile?.text?.trim() || '';
    
    if (!profileText || !jobDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both your profile and the job description.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const prompt = `
You are a career advisor AI. Analyze the following profile against the job description and provide a structured response.

CURRENT PROFILE:
${profileText}

TARGET JOB DESCRIPTION:
${jobDescription}

Please analyze and respond with a JSON object containing:
1. "matches": Array of skills/experiences that align well with the job
2. "gaps": Array of missing skills/experiences needed for the job
3. "improvedProfile": A rewritten profile that addresses the gaps while maintaining authenticity
4. "suggestions": Array of specific actionable suggestions for improvement

Format your response as valid JSON only, no additional text.
`;

      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      try {
        const analysisResult = JSON.parse(data.response);
        onAnalysisComplete(analysisResult);
        
        toast({
          title: "Analysis Complete",
          description: "Your profile has been analyzed successfully!",
        });
      } catch (parseError) {
        throw new Error('Failed to parse AI response. Please try again.');
      }

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Ollama. Please check if Ollama is running.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Ollama Configuration
          </CardTitle>
          <CardDescription>
            Configure your local Ollama instance settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ollama-url">Ollama URL</Label>
              <Input
                id="ollama-url"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="llama3.2"
              />
            </div>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Make sure Ollama is running locally and the specified model is installed. 
              You can install models using: <code className="bg-muted px-1 py-0.5 rounded">ollama pull {model}</code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Current Profile</CardTitle>
            <CardDescription>
              Upload a file or paste your resume, LinkedIn profile, or professional summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload File</TabsTrigger>
                <TabsTrigger value="text">Type/Paste Text</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      disabled={isProcessingFile}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {uploadedFile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearUploadedFile}
                        disabled={isProcessingFile}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  {isProcessingFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing file...
                    </div>
                  )}
                  
                  {uploadedFile && (
                    <div className="p-3 bg-muted rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">{uploadedFile.filename}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {uploadedFile.text.substring(0, 200)}...
                      </div>
                    </div>
                  )}
                  
                  <Alert>
                    <Upload className="h-4 w-4" />
                    <AlertDescription>
                      Supported formats: PDF, Word documents (.doc, .docx), and text files (.txt)
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
              
              <TabsContent value="text">
                <Textarea
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                  placeholder="Enter your current professional profile, resume content, or LinkedIn summary..."
                  className="min-h-[300px]"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target Job Description</CardTitle>
            <CardDescription>
              Paste the job description you want to optimize for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Enter the target job description including required skills, qualifications, and responsibilities..."
              className="min-h-[300px]"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={analyzeProfile} 
          disabled={isAnalyzing || (!profile.trim() && !uploadedFile?.text) || !jobDescription.trim()}
          size="lg"
          className="min-w-[200px]"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Analyze Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
};