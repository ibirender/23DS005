import axios from 'axios';

// --- LOGGING TYPES & CONSTRAINTS ---

export type LogStack = 'backend' | 'frontend';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type BackendPackage =
  | 'cache'
  | 'controller'
  | 'cron_job'
  | 'db'
  | 'domain'
  | 'handler'
  | 'repository'
  | 'route'
  | 'service';

export type FrontendPackage = 
  | 'api'
  | 'component'
  | 'hook'
  | 'page'
  | 'state'
  | 'style';

export type SharedPackage = 
  | 'auth'
  | 'config'
  | 'middleware'
  | 'utils';

// Function Overloads for Strict Type Checking Based on Stack

export async function Log(
  stack: 'backend',
  level: LogLevel,
  pkg: BackendPackage | SharedPackage,
  message: string
): Promise<void>;

export async function Log(
  stack: 'frontend',
  level: LogLevel,
  pkg: FrontendPackage | SharedPackage,
  message: string
): Promise<void>;

/**
 * Reusable Logging function that captures lifecycle events and reports to the Test Server.
 */
export async function Log(
  stack: LogStack,
  level: LogLevel,
  pkg: string,
  message: string
): Promise<void> {
  const logEntry = {
    stack,
    level,
    package: pkg.toLowerCase(),
    message
  };

  const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://20.244.56.144/evaluation-service/logs';
  const AUTH_TOKEN = process.env.LOGGING_AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJiaXJlbmRlcl8yM2RzMDA1QHNhaXRtLmFjLmluIiwiZXhwIjoxNzc3OTY5NDUwLCJpYXQiOjE3Nzc5Njg1NTAsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiJmMTM1NjNiZC1jZWQ4LTQ1Y2MtYmUyMS1mOTE4YjI3ZDY2OGEiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJiaXJlbmRlciBrdW1hciIsInN1YiI6IjE4OGVmYjE0LTNkNWMtNDI1My1hZDExLTQ4ZjVjOTIzNTUzZSJ9LCJlbWFpbCI6ImJpcmVuZGVyXzIzZHMwMDVAc2FpdG0uYWMuaW4iLCJuYW1lIjoiYmlyZW5kZXIga3VtYXIiLCJyb2xsTm8iOiIyM2RzMDA1IiwiYWNjZXNzQ29kZSI6ImJka3pFSCIsImNsaWVudElEIjoiMTg4ZWZiMTQtM2Q1Yy00MjUzLWFkMTEtNDhmNWM5MjM1NTNlIiwiY2xpZW50U2VjcmV0IjoiZXRUcEZtY2NQQ0FEWkd4eCJ9.Y_v3sgpwJOBBpZPKtrEj2WBlZ2EPgLX9-B3PNHXs35g';

  try {
    const response = await axios.post(TEST_SERVER_URL, logEntry, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000 
    });

    if (response.status === 200 && response.data?.logID) {
      console.log(`[Success] Log Pushed! LogID: ${response.data.logID}`);
    }
  } catch (error) {
    let errorMessage = 'Unknown Error';
    if (axios.isAxiosError(error)) {
       errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    } else if (error instanceof Error) {
       errorMessage = error.message;
    }
    console.debug(`[Telemetry Debug] Failed to send log: ${errorMessage}`);
  }
}
