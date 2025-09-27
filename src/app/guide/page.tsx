'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Download, FileText, ExternalLink, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FeedbackButton } from '@/components/feedback/feedback-form';

export default function GuidePage() {
  const router = useRouter();

  const sampleCsvData = `solicitation_number,title,description,agency,office,naics_code,naics_description,posted_date,response_due_date,archive_date,contact_info,sam_url
"ABC123-2024","Software Development Services","Custom software development for agency systems","Department of Defense","IT Services Division","541511","Custom Computer Programming Services","2024-01-15","2024-02-15","2024-03-15","john.doe@agency.gov","https://sam.gov/opp/abc123"
"DEF456-2024","Consulting Services","Management consulting for process improvement","General Services Administration","Professional Services","541611","Administrative Management and General Management Consulting Services","2024-01-20","2024-02-20","2024-03-20","jane.smith@gsa.gov","https://sam.gov/opp/def456"`;

  const requiredFields = [
    { field: 'solicitation_number', description: 'Unique identifier for the contract opportunity', required: true },
    { field: 'title', description: 'Title of the contract opportunity', required: true },
    { field: 'description', description: 'Detailed description of the opportunity', required: false },
    { field: 'agency', description: 'Government agency posting the opportunity', required: false },
    { field: 'office', description: 'Specific office within the agency', required: false },
    { field: 'naics_code', description: 'NAICS industry classification code', required: false },
    { field: 'naics_description', description: 'Description of the NAICS code', required: false },
    { field: 'posted_date', description: 'Date the opportunity was posted (YYYY-MM-DD)', required: false },
    { field: 'response_due_date', description: 'Due date for responses (YYYY-MM-DD)', required: false },
    { field: 'archive_date', description: 'Date the opportunity will be archived (YYYY-MM-DD)', required: false },
    { field: 'contact_info', description: 'Contact information for questions', required: false },
    { field: 'sam_url', description: 'Link to the full opportunity on SAM.gov', required: false },
  ];

  const downloadSample = () => {
    const blob = new Blob([sampleCsvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_contracts.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          onClick={() => router.push('/')}
          variant="ghost" 
          className="mb-6 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-4">
              CSV Mass Upload Guide
            </h1>
            <p className="text-lg text-slate-600">
              Learn how to bulk import contract opportunities into SamX
            </p>
          </div>

          <div className="space-y-8">
            {/* Overview */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <Database className="mr-2 h-5 w-5 text-blue-600" />
                  Mass Upload Overview
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Bulk import contract data for efficient processing and analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-700">
                  The CSV mass upload feature allows you to import multiple contract opportunities at once, 
                  making it easy to populate your database with large datasets from SAM.gov or other sources.
                </p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <FileText className="h-8 w-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold text-blue-900 mb-1">Prepare CSV</h3>
                    <p className="text-sm text-blue-800">Format your data according to our specification</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <Database className="h-8 w-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-green-900 mb-1">Upload File</h3>
                    <p className="text-sm text-green-800">Import your CSV through the dashboard</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <CheckCircle className="h-8 w-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold text-purple-900 mb-1">Review Data</h3>
                    <p className="text-sm text-purple-800">Verify imported contracts in your dashboard</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Where to Get Files */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <ExternalLink className="mr-2 h-5 w-5 text-green-600" />
                  Where to Get Contract Data
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Sources for downloading contract opportunity data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 rounded-full p-2 text-sm font-semibold text-green-800 w-8 h-8 flex items-center justify-center">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">SAM.gov API Export</h3>
                      <p className="text-sm text-slate-600 mt-1 mb-2">
                        Use the SAM.gov API to export contract opportunities in bulk. This is the most comprehensive source.
                      </p>
                      <Button 
                        onClick={() => window.open('https://sam.gov/content/api', '_blank')}
                        variant="outline" 
                        size="sm"
                        className="border-green-300 text-green-700"
                      >
                        SAM.gov API Documentation
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 rounded-full p-2 text-sm font-semibold text-green-800 w-8 h-8 flex items-center justify-center">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">SAM.gov Data Extracts</h3>
                      <p className="text-sm text-slate-600 mt-1 mb-2">
                        Download daily data extracts from SAM.gov's data repository. These files contain the latest opportunities.
                      </p>
                      <Button 
                        onClick={() => window.open('https://sam.gov/data-services', '_blank')}
                        variant="outline" 
                        size="sm"
                        className="border-green-300 text-green-700"
                      >
                        SAM.gov Data Services
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 rounded-full p-2 text-sm font-semibold text-green-800 w-8 h-8 flex items-center justify-center">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">Third-Party Providers</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Some commercial services provide cleaned and structured government contract data in CSV format.
                      </p>
                    </div>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Tip</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    For the most up-to-date data, use SAM.gov's API or daily data extracts. 
                    Make sure your API key is configured in the setup page before attempting to sync data.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* CSV Format */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <FileText className="mr-2 h-5 w-5 text-purple-600" />
                  CSV Format Specification
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Required format and fields for your CSV file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800">Field Specifications</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300">
                          <th className="text-left p-2 font-semibold text-slate-700">Field Name</th>
                          <th className="text-left p-2 font-semibold text-slate-700">Required</th>
                          <th className="text-left p-2 font-semibold text-slate-700">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requiredFields.map((field, index) => (
                          <tr key={index} className="border-b border-slate-200">
                            <td className="p-2 font-mono text-sm text-slate-800">{field.field}</td>
                            <td className="p-2">
                              {field.required ? (
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Required</span>
                              ) : (
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">Optional</span>
                              )}
                            </td>
                            <td className="p-2 text-sm text-slate-600">{field.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-800">Sample CSV Format</h3>
                      <Button 
                        onClick={downloadSample}
                        variant="outline" 
                        size="sm"
                        className="border-purple-300 text-purple-700"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Download Sample
                      </Button>
                    </div>
                    <div className="bg-slate-100 p-4 rounded-lg border border-slate-300 overflow-x-auto">
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap">{sampleCsvData}</pre>
                    </div>
                  </div>
                </div>

                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Important Notes</AlertTitle>
                  <AlertDescription className="text-amber-700 space-y-2">
                    <p>• Ensure the first row contains column headers exactly as specified</p>
                    <p>• Use comma-separated values with quotes around text fields</p>
                    <p>• Date fields should be in YYYY-MM-DD format</p>
                    <p>• Only <strong>solicitation_number</strong> and <strong>title</strong> are required</p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Upload Process */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <Database className="mr-2 h-5 w-5 text-indigo-600" />
                  How to Upload Your CSV
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Step-by-step process for importing your contract data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-indigo-100 rounded-full p-2 text-sm font-semibold text-indigo-800 w-8 h-8 flex items-center justify-center">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Access the Dashboard</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Complete your API setup and navigate to the main dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-indigo-100 rounded-full p-2 text-sm font-semibold text-indigo-800 w-8 h-8 flex items-center justify-center">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Find the Import Section</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Look for the "Import CSV" button or section in your dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-indigo-100 rounded-full p-2 text-sm font-semibold text-indigo-800 w-8 h-8 flex items-center justify-center">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Upload Your File</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Select your properly formatted CSV file and click upload.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-indigo-100 rounded-full p-2 text-sm font-semibold text-indigo-800 w-8 h-8 flex items-center justify-center">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Review and Confirm</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Review the import summary and confirm the upload. Your contracts will appear in the dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    onClick={() => router.push('/dashboard')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    Go to Dashboard
                  </Button>
                  <Button 
                    onClick={() => router.push('/setup')}
                    variant="outline"
                    className="border-slate-300 text-slate-700"
                  >
                    Setup API Key
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
      <FeedbackButton />
    </>
  );
}