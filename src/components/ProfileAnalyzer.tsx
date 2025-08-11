import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Brain, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

  const analyzeProfile = async () => {
    if (!profile.trim() || !jobDescription.trim()) {
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
${profile}

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
              Paste your resume, LinkedIn profile, or professional summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              placeholder="Enter your current professional profile, resume content, or LinkedIn summary..."
              className="min-h-[300px]"
            />
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
          disabled={isAnalyzing || !profile.trim() || !jobDescription.trim()}
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