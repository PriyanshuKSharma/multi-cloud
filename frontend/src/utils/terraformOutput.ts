/**
 * Utility to extract actionable error messages from complex Terraform output 
 * or backend error structures.
 */
export const extractProvisioningErrorMessage = (
  output: any,
  defaultMessage: string = 'Provisioning failed. Please check your configuration and try again.'
): string => {
  if (!output) return defaultMessage;

  // Handle direct string message
  if (typeof output === 'string') return output;

  // Handle backend error detail structure
  if (output.detail && typeof output.detail === 'string') {
    return output.detail;
  }

  // Handle complex terraform_output structure
  // Common pattern: { error: "...", detail: "..." }
  if (output.error || output.detail) {
    const mainError = output.error || '';
    const detailError = output.detail || '';
    
    if (mainError && detailError) return `${mainError}: ${detailError}`;
    return mainError || detailError;
  }

  // Handle standard HTTP error response data
  if (output.errorMessage) return output.errorMessage;
  if (output.message) return output.message;

  return defaultMessage;
};

/**
 * Normalize raw log text for display in UI components.
 * Removes carriage returns, trims trailing spaces, and collapses consecutive empty lines.
 */
export const normalizeLogText = (log: string): string => {
  if (!log) return '';
  return log
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trimEnd())
    .filter((line, idx, arr) => {
      // Preserve a single empty line but collapse multiples
      if (line === '') {
        return arr[idx - 1] !== '';
      }
      return true;
    })
    .join('\n');
};

/**
 * Formats Terraform output object into a pretty-printed JSON string.
 * Optionally omits specific keys like 'logs' to keep the display clean.
 */
export interface FormatOptions {
  omitLogsKey?: boolean;
  indent?: number;
}

export const formatTerraformOutput = (
  output: Record<string, any>,
  options: FormatOptions = {}
): string => {
  if (!output) return '{}';
  
  const { omitLogsKey = false, indent = 2 } = options;
  
  try {
    let displayOutput = { ...output };
    
    if (omitLogsKey && 'logs' in displayOutput) {
      const newOutput = { ...displayOutput };
      delete newOutput.logs;
      displayOutput = newOutput;
    }
    
    return JSON.stringify(displayOutput, null, indent);
  } catch (err) {
    console.error('Error formatting terraform output:', err);
    return '{}';
  }
};
