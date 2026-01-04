// Debug and error logging system
class DebugLogger {
    constructor() {
        this.logs = [];
        this.errors = [];
        this.warnings = [];
        this.maxLogs = 100;
        this.enabled = true;
    }

    log(message, type = 'info') {
        if (!this.enabled) return;
        
        const logEntry = {
            timestamp: new Date().toLocaleTimeString(),
            message: message,
            type: type // 'info', 'error', 'warning', 'debug'
        };
        
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Only log errors to browser console (not spam)
        if (type === 'error') {
            console.error(`[ERROR] ${message}`);
        }
        
        // Update debug panel if it exists
        this.updateDebugPanel();
        
        if (type === 'error') {
            this.errors.push(logEntry);
        } else if (type === 'warning') {
            this.warnings.push(logEntry);
        }
    }

    error(message, error = null) {
        let errorMessage = message;
        if (error) {
            errorMessage += `: ${error.message || error}`;
            if (error.stack) {
                errorMessage += `\nStack: ${error.stack}`;
            }
        }
        this.log(errorMessage, 'error');
    }

    warning(message) {
        this.log(message, 'warning');
    }

    debug(message) {
        this.log(message, 'debug');
    }

    updateDebugPanel() {
        const panel = document.getElementById('debugConsole');
        if (!panel) return;
        
        const content = panel.querySelector('.debug-content');
        if (!content) return;
        
        // Show last 20 logs
        const recentLogs = this.logs.slice(-20);
        content.innerHTML = recentLogs.map(log => {
            const className = `debug-entry debug-${log.type}`;
            return `<div class="${className}">[${log.timestamp}] ${log.message}</div>`;
        }).join('');
        
        // Auto-scroll to bottom
        content.scrollTop = content.scrollHeight;
    }

    clear() {
        this.logs = [];
        this.errors = [];
        this.warnings = [];
        this.updateDebugPanel();
    }

    getStats() {
        return {
            total: this.logs.length,
            errors: this.errors.length,
            warnings: this.warnings.length
        };
    }
}

// Global debug logger
window.debugLogger = new DebugLogger();

// Helper function for safe logging (can be used before debug.js loads)
window.debugLog = function(message, type = 'debug') {
    if (window.debugLogger) {
        window.debugLogger.log(message, type);
    } else {
        console.log(`[DEBUG] ${message}`);
    }
};

window.debugError = function(message, error = null) {
    if (window.debugLogger) {
        window.debugLogger.error(message, error);
    } else {
        console.error(`[ERROR] ${message}`, error);
    }
};

window.debugWarning = function(message) {
    if (window.debugLogger) {
        window.debugLogger.warning(message);
    } else {
        console.warn(`[WARNING] ${message}`);
    }
};

// Only capture errors, not all console logs (prevents spam)
const originalConsoleError = console.error;
console.error = function(...args) {
    originalConsoleError.apply(console, args);
    if (window.debugLogger) {
        window.debugLogger.error(args.join(' '));
    }
};

// Global error handler
window.addEventListener('error', (event) => {
    window.debugLogger.error(`Uncaught Error: ${event.message}`, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    window.debugLogger.error(`Unhandled Promise Rejection: ${event.reason}`, event.reason);
});

