export const getApiUrl = () => {
  // In production, use the production URL
  if (process.env.NODE_ENV === "production") {
    return "https://text2sql-backend.onrender.com";
  }

  // In development, use localhost
  return "http://localhost:8000";
};

export const apiUrl = getApiUrl();

// Export a function to test the API connection
export const testApiConnection = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/v1/health`);
    return response.ok;
  } catch (error) {
    console.error("API connection test failed:", error);
    return false;
  }
};
