# EPG Combine - Cloudflare Pages

A simple EPG (Electronic Program Guide) combination service built with Astro and designed to run on Cloudflare Pages.

## Features

- **Simple Login**: On-page authentication with username/password
- **EPG URL Management**: Add multiple EPG URLs (.xml and .gz files) in priority order
- **Automatic Processing**: Parses and caches EPG feeds every 12 hours
- **Priority-Based Merging**: Combines feeds with conflict resolution based on URL priority
- **Channel ID Mapping**: Edit and persist channel ID transformations
- **Search & Lookup**: Search channels and view program information
- **Public API**: Access combined guide at `/guide.xml`
- **Statistics**: View channel count, program count, and processing status
- **Error Handling**: Comprehensive logging and error reporting

## Project Structure

```
src/
├── components/           # Astro components
│   ├── LoginForm.astro   # Login form component
│   └── Dashboard.astro   # Main dashboard (inline)
├── lib/                  # Core libraries
│   ├── auth.ts          # Authentication system
│   ├── epg-parser.ts    # XML EPG parsing utilities
│   ├── priority-merger.ts # Priority-based merging logic
│   ├── logger.ts        # Error handling and logging
│   └── channel-mapper.ts # Channel ID mapping (placeholder)
├── pages/               # API endpoints and pages
│   ├── index.astro      # Login page
│   ├── dashboard.astro  # Main dashboard
│   ├── guide.xml.ts     # Combined EPG endpoint
│   ├── api/             # API endpoints
│   │   ├── login.ts     # Authentication
│   │   ├── epg-list.ts  # EPG URL management
│   │   ├── stats.ts     # Statistics
│   │   ├── search.ts    # Channel search
│   │   ├── channel-info.ts # Program lookup
│   │   ├── channel-mappings.ts # Channel ID mapping
│   │   └── logs.ts      # Error logs
└── env.d.ts            # Environment variable types
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd epg-combine
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## Configuration

Set environment variables in your Cloudflare Pages dashboard:

- `ADMIN_USERNAME`: Admin username for login
- `ADMIN_PASSWORD`: Admin password for login
- `KV_NAMESPACE`: Cloudflare KV namespace (optional, for production)
- `D1_DATABASE`: Cloudflare D1 database binding (optional, for production)

## Usage

1. **Login**: Visit the site and login with the admin credentials
2. **Add EPG URLs**: Go to Dashboard → EPG URL Management and add your EPG feed URLs
3. **Set Priority**: URLs are processed in order - first URL has highest priority
4. **View Statistics**: Monitor channel count, program count, and errors
5. **Search Channels**: Use the search feature to find channels and view program info
6. **Channel Mapping**: Use the EPG editor to map channel IDs (e.g., `aande.us` → `a&enetwork.us`)
7. **Access Combined Guide**: The combined EPG is available at `/guide.xml`

## API Endpoints

### Authentication
- `POST /api/login` - Login
- `GET /api/login` - Check authentication status
- `DELETE /api/login` - Logout

### EPG Management
- `GET /api/epg-list` - Get EPG URLs
- `POST /api/epg-list` - Update EPG URLs
- `DELETE /api/epg-list` - Clear EPG URLs

### Statistics
- `GET /api/stats` - Get processing statistics

### Search & Lookup
- `GET /api/search?q=query` - Search channels
- `GET /api/channel-info?id=channelId` - Get channel program info

### Channel Mapping
- `GET /api/channel-mappings` - Get channel mappings
- `POST /api/channel-mappings` - Add/update mapping
- `DELETE /api/channel-mappings` - Delete mapping

### Logs
- `GET /api/logs` - Get error logs
- `DELETE /api/logs` - Clear logs

### Public API
- `GET /guide.xml` - Combined EPG feed (public)
- `GET /guide.xml?format=json` - Combined EPG as JSON

## EPG Format Support

The system supports standard XMLTV format EPG files:
- `.xml` files (plain XML)
- `.gz` files (gzip compressed XML)
- Standard channel and program elements
- Time format: `YYYYMMDDHHMMSS +0000`

## Priority-Based Conflict Resolution

When multiple EPG feeds contain the same channel/program:
1. First URL in the list has highest priority
2. Conflicting programs are resolved by keeping the higher priority source
3. Channel information is merged with priority-based updates

## Channel ID Mapping

Use the EPG editor to create persistent mappings:
- Map original channel IDs to your preferred IDs
- Mappings persist across EPG updates
- Support for feed-specific mappings

## Deployment to Cloudflare Pages

1. Push your code to a Git repository
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Connect your Git repository
4. Set build settings:
   - Build command: `npm run build`
   - Build directory: `dist`
5. Add environment variables in the dashboard
6. Deploy!

## Development Notes

### Current Implementation Status

✅ **Completed:**
- Authentication system
- EPG URL management
- XML parsing utilities
- Priority-based merging logic
- Dashboard interface
- Search and program lookup
- Error handling and logging
- Combined guide endpoint

🔄 **Mock Data:**
- Statistics API uses mock data
- Search uses mock channel data
- Channel info uses mock program data
- Channel mappings use in-memory storage

⚠️ **Production Ready:**
- Replace mock data with Cloudflare KV/D1 storage
- Add proper error handling for network requests
- Implement scheduled processing with Workers
- Add proper caching strategies

### Next Steps for Production

1. **Set up Cloudflare KV** for caching parsed EPG data
2. **Set up Cloudflare D1** for persistent storage of URLs, mappings, and statistics
3. **Create Cloudflare Worker** for scheduled processing (every 12 hours)
4. **Add proper error handling** for network timeouts and failures
5. **Implement caching** for better performance
6. **Add monitoring** and alerting for processing failures

## License

MIT License - see LICENSE file for details.