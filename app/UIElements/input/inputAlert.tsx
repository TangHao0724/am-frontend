
type Props = {
  error: string;
};

export default function InputAlert({error}:Props){
    return(
        <p className="text-alert text-sm mt-1">{error}</p>
    )
}