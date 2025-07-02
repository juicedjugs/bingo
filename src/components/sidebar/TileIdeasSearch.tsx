import { ListItem, TextField } from "@mui/material";

interface TileIdeasSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
}

const TileIdeasSearch = ({ search, onSearchChange }: TileIdeasSearchProps) => {
  return (
    <ListItem sx={{ mb: 2 }}>
      <TextField
        label="Search"
        variant="outlined"
        size="small"
        fullWidth
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </ListItem>
  );
};

export default TileIdeasSearch;
