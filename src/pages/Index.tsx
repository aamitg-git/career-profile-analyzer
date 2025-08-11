import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileAnalyzer } from '@/components/ProfileAnalyzer';
import { AnalysisResults } from '@/components/AnalysisResults';
import { FileText, Target, Zap } from 'lucide-react';

export interface AnalysisData {
  matches: string[];
  gaps: string[];
  improvedProfile: string;
  suggestions: string[];
}

const Index = () => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Career Profile Analyzer
          </h1>
          <p className="text-lg text-muted-foreground">
            AI-powered profile optimization using local LLM
          </p>
        </header>

        <div className="grid gap-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Profile Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Upload your current profile and target job description for comprehensive analysis
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Gap Identification</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Identify skills, experience, and keyword gaps between your profile and target role
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Profile Enhancement</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate an improved profile that addresses identified gaps and maximizes match potential
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="analyze" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analyze">Analyze Profile</TabsTrigger>
            <TabsTrigger value="results" disabled={!analysisData}>
              View Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-6">
            <ProfileAnalyzer 
              onAnalysisComplete={setAnalysisData}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {analysisData && <AnalysisResults data={analysisData} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;