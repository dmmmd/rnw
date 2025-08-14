import {useState} from 'react';
import './App.css';
import './Form.css';
import {generateSalesPitch} from "./ai/aiFacade.ts";
import type {UserItem} from "./goods/UserItem.ts";
import {detectCategory} from "./goods/taxonomy/detectCategory.ts";
import {getPossibleItemConditions} from "./goods/ItemCondition.ts";

function App() {
    const [itemName, setItemName] = useState('');
    const [condition, setCondition] = useState(getPossibleItemConditions()[0]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pitch, setPitch] = useState('');
    const [category, setCategory] = useState('');

    async function generateSalesAd(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const item: UserItem = {name: itemName, condition, description};
        const [pitch, category] = await Promise.allSettled([
            generatePitch(item),
            suggestCategory(item),
        ]);

        const errorMessages = [pitch, category]
            .filter(r => r.status === 'rejected')
            .map((r: PromiseRejectedResult) => r.reason.message);

        if (errorMessages.length > 0) {
            setError('Hups, something went wrong: ' + errorMessages.join(', ') + '. Please try again.');
        }

        setLoading(false);
    }

    async function generatePitch(userItem: UserItem) {
        setPitch('');
        const salesPitch = await generateSalesPitch(userItem);
        setPitch(salesPitch);
    }

    async function suggestCategory(userItem: UserItem) {
        setCategory('');
        const safeName = userItem.name.substring(0, 255); // @todo we should do a lot more, and on the server-side, obviously
        const category = await detectCategory(safeName);
        setCategory(category.path);
    }

    return (
        <main>
            <h1>Show me what you got</h1>
            <form onSubmit={generateSalesAd} aria-label="Item details form">
                <label htmlFor="itemName">Item Name</label>
                <input
                    id="itemName"
                    type="text"
                    value={itemName}
                    onChange={e => setItemName(e.target.value)}
                    required
                />
                <label htmlFor="condition">Condition</label>
                <select
                    id="condition"
                    value={condition}
                    onChange={e => setCondition(e.target.value)}
                >
                    {getPossibleItemConditions().map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Generating...' : 'Generate a sales ad'}
                </button>
            </form>
            {error && <div role="alert" style={{color: 'red'}}>{error}</div>}
            {pitch && (
                <section aria-live="polite">
                    <h2>Suggested Sales Pitch</h2>
                    <p>{pitch}</p>
                    <h2>Suggested Category</h2>
                    <p>{category}</p>
                </section>
            )}
        </main>
    );
}

export default App;
