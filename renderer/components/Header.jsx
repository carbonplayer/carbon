import React from "react"
import { connect } from "react-redux"
import PropTypes from "prop-types"
import { searchSong, playMedia, requestUpdateLibrary, showFullMenu } from "../actions"
import { getPlayer } from "../utils"
import { refresh } from "../assets/staticbase64"
import "./stylesheets/Header.scss"
const path = window.require("path")
const { ipcRenderer } = window.require("electron")
const Store = window.require("electron-store")

class Header extends React.Component {
    constructor (props) {
        super(props)
        this.state = {
            value: "",
            isSearchingMedia: false,
            searchResult: []
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleClick = this.handleClick.bind(this)
        this.handleClose = this.handleClose.bind(this)
        this.updateLibrary = this.updateLibrary.bind(this)
        this.toggleMenu = this.toggleMenu.bind(this)
    }

    componentDidMount () {
        window.onclick = this.handleClose
    }

    // This component don't unmount but we need to be cautious anyway
    componentWillUnmount () {
        window.onclick = null
    }

    // Close search box
    handleClose () {
        const { searchResult } = this.state
        if (searchResult.length > 0) {
            this.setState({ searchResult: [] })
            this.setState({ value: "" })
        }
    }

    handleSubmit (e) {
        const { library } = this.props
        e.preventDefault()
        this.requestSearching()

        var results = searchSong(this.state.value, library)
        this.setState({ searchResult: results })
        this.searchingCompleted()
    }

    handleChange (e) {
        const { library } = this.props
        this.setState({ value: e.currentTarget.value })
        this.requestSearching()

        var results = searchSong(e.currentTarget.value, library)
        this.setState({ searchResult: results })
        this.searchingCompleted()
    }

    handleClick (e) {
        const { dispatch } = this.props
        const media = {
            file: e.currentTarget.className.split(" result-item")[0],
            source: "Music"
        }
        dispatch(playMedia(media, getPlayer()))
        this.setState({ searchResult: [] })
        this.setState({ value: "" })
    }

    requestSearching () {
        this.setState({ isSearchingMedia: true })
    }

    updateLibrary () {
        const store = new Store()
        const dirs = store.get("libLocation")
        const { dispatch } = this.props
        ipcRenderer.send("should-update", dirs)
        dispatch(requestUpdateLibrary())
    }

    searchingCompleted () {
        this.setState({ isSearchingMedia: false })
    }

    toggleMenu () {
        const { dispatch, fullMenu } = this.props
        dispatch(showFullMenu(!fullMenu))
    }

    render () {
        const { isUpdating } = this.props
        const { isSearchingMedia, searchResult, value } = this.state
        return (
            <div className="Header">
                <div className="menu-toggle" onClick={this.toggleMenu}>
                    <div className="menu-icon"></div>
                    <div className="menu-icon"></div>
                    <div className="menu-icon"></div>
                </div>
                <div className="update-library">
                    {isUpdating
                        ? <div className="is-updating">
                            <div className="spinner-wrapper"></div>
                            <div>Updating library...</div>
                        </div>
                        : <div className="refresh" onClick={this.updateLibrary}>
                            <img src={`data:image/png;base64,${refresh}`}
                                width="20" height="20" />
                        </div>
                    }
                </div>
                <div className="media-search">
                    <form onSubmit={this.handleSubmit}>
                        <span><button type="submit"></button></span>
                        <input type="search" value={value}
                            placeholder="Search media"
                            onChange={this.handleChange} />
                    </form>
                </div>
                <div className="search-result" style={searchResult.length < 1 ? { display: "none" }
                    : { display: "block" }}>
                    <div className="search-indicator" style={isSearchingMedia
                        ? { display: "block" } : { display: "none" }}>
                        <div className="search-marquee"></div>
                    </div>
                    {searchResult.map((item, i) =>
                        <div key={i} className={`${item} result-item`}
                            onClick={this.handleClick}>
                            {path.basename(item, path.extname(item))}
                        </div>
                    )}
                </div>
            </div>
        )
    }
}

Header.propTypes = {
    isUpdating: PropTypes.bool,
    library: PropTypes.array,
    fullMenu: PropTypes.bool
}

Header.defaultProps = {
    isUpdating: false,
    library: [],
    fullMenu: true
}

const mapStateToProps = state => ({
    isUpdating: state.media.isUpdating,
    library: state.media.library,
    fullMenu: state.view.fullMenu
})

export default connect(mapStateToProps, null)(Header)
