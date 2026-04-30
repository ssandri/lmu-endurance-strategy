## Summary
- **Estimated Total Laps** removed from race creation form — it's now only settable once the race starts (execution page or strategy creation)
- **Track list** updated to match the official LMU circuit roster (full layouts + alternate layouts)
- Database schema updated to allow NULL for `estimated_total_laps`

## Test plan
- [ ] Create a race without specifying estimated total laps
- [ ] Verify estimated total laps can be set on the execution page
- [ ] Verify strategy creation still requires estimated total laps before calculating
- [ ] Verify all tracks in dropdown match the official list

🤖 Generated with [Claude Code](https://claude.com/claude-code)
