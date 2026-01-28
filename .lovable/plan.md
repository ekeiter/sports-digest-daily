

## Plan: Add Help Instructions Dialog to Feed Topic Manager

### Overview
Add a help button (question mark icon) to the Preferences page header that opens a dialog containing user-friendly instructions for using the Feed Topic Manager. The instructions will be based on your draft with minor enhancements for clarity.

---

### Implementation Details

#### 1. Update Preferences.tsx

**Add imports:**
- Import `HelpCircle` icon from lucide-react
- Import Dialog components from `@/components/ui/dialog`

**Add state:**
- `showHelpDialog` boolean to control dialog visibility

**Add Help Button to Header:**
Position a help icon button next to the "Feed Topic Manager" title. The button will be subtle but accessible.

**Add Help Dialog Component:**
Create a Dialog with the following content structure:

```
How to Use the Feed Topic Manager
---------------------------------

BROWSING TOPICS
- Select any topic to drill down into more specific categories
- Continue drilling down to find teams, schools, players, and more
- Clicking any item opens a focused news feed for that topic

SEARCHING
- Use the search box to find any topic quickly
- Search includes teams, players, coaches, schools, and leagues
- Click any search result to view its focused news feed

FAVORITING TOPICS
- Click the heart icon to favorite any topic
- Click again to remove from favorites
- Favorites appear at the top of the screen for quick access
- Click any favorite to see its focused news feed

REMOVING FAVORITES
- Mobile/Tablet: Press and hold a favorite card, then tap the X
- Desktop: Click the X button on the favorite card

COMBINED FEED
- Click "Combined Feed" button to see news from all favorites
- Your feed can include any mix of players, teams, leagues, and more
```

**Styling:**
- Use a `HelpCircle` icon (small, muted color) positioned inline with the title
- Dialog should be responsive and readable on mobile
- Use clear section headers with proper spacing

---

### File Changes

| File | Change |
|------|--------|
| `src/pages/Preferences.tsx` | Add imports, state, help button, and dialog component |

---

### Technical Notes

1. **Icon Placement**: The help icon will be placed to the right of the "Feed Topic Manager" title using flexbox alignment
2. **Dialog Pattern**: Uses existing shadcn/ui Dialog components for consistency
3. **Responsive**: Dialog content will be scrollable on smaller screens
4. **Accessibility**: Button includes proper aria-label and title attributes
5. **No External Dependencies**: Uses existing UI components only

---

### User Experience

- The help button is always visible in the header when on the Preferences page
- Single click opens the dialog with clear, scannable instructions
- Instructions cover all key interactions: browsing, searching, favoriting, and using the combined feed
- Device-specific deletion instructions are clearly separated (mobile vs desktop)

